'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QuizResults } from '@/components/QuizResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useVolume } from '@/components/VolumeControl';
import { ensureAudioUnlocked, unlockAudio } from '@/utils/audioUnlock';

interface Question {
  id: number;
  preview_url: string;
  options: string[];
  correct_answer: string;
  artist: string;
  genre: string;
  album?: string;
  image?: string;
  song_name?: string;
}

interface Answer {
  question_id: number;
  selected_answer: string;
}

interface QuizData {
  quiz_id: string;
  questions: Question[];
}

/**
 * QuizPage Component
 * 
 * Manages the complete quiz flow with timed phases:
 * 1. Ready screen → User clicks "Start Quiz"
 * 2. Countdown (5s) → "Round X/7" display
 * 3. Guessing (7s) → Audio plays, user selects artist
 * 4. Reveal (5s) → Shows album art, song name, correct answer
 * 5. Transition (5s) → "Round X/7" for next question
 * 6. Repeat steps 3-5 for all questions
 * 7. Submit → Display results
 * 
 * Answer Persistence Strategy:
 * - Uses useRef (answersRef) for immediate persistence across renders
 * - State (answers) synced for UI reactivity
 * - Array pre-initialized to prevent sparse array issues
 * 
 * Database Integration:
 * - Backend receives: quiz_id, answers[], playlist, genre, duration_ms
 * - Backend returns: score, percentage, results[], saved (boolean)
 * - Auth token sent via Authorization header if user logged in
 */
function QuizPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlist = searchParams.get('playlist');
  const genre = searchParams.get('genre');
  const { token } = useAuth();
  const { siteVolume } = useVolume();

  // Core quiz data
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  
  // Quiz state management
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [answers, setAnswers] = useState<Answer[]>([]);
  const answersRef = useRef<Answer[]>([]); // Ref for immediate answer persistence
  const isSubmittingRef = useRef(false); // Ref to prevent double submission
  
  // Game flow states
  const [gamePhase, setGamePhase] = useState<'ready' | 'countdown' | 'guessing' | 'reveal' | 'transition'>('ready');
  const [phaseTimer, setPhaseTimer] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // Audio and UI states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submitting, setSubmitting] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!playlist) {
        console.error('No playlist specified');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/quiz/new?playlist=${playlist}&genre=${genre || 'unknown'}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Quiz error:', data.error);
        setLoading(false);
        return;
      }
      
      setQuizData(data);
      
      /**
       * Initialize answers array with empty objects for all questions
       * - Pre-fills array to prevent sparse array issues
       * - Each answer starts with empty string (marks as "no answer" if time runs out)
       * - Both state and ref are initialized for consistency
       */
      const initialAnswers = data.questions.map((q: Question) => ({
        question_id: q.id,
        selected_answer: ''
      }));
      setAnswers(initialAnswers);
      answersRef.current = initialAnswers;
      
      console.log(`🎮 Quiz loaded: ${initialAnswers.length} questions`);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setLoading(false);
    }
  }, [playlist, genre]);

  // Fetch quiz data on component mount
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const getNextPhaseDuration = useCallback(() => {
    if (gamePhase === 'countdown') return 7; // guessing phase
    if (gamePhase === 'guessing') return 5; // reveal phase
    if (gamePhase === 'reveal') return 5; // transition phase
    if (gamePhase === 'transition') return 7; // next guessing phase
    return 5;
  }, [gamePhase]);

  const handlePhaseTransition = useCallback(() => {
    // Prevent any transitions if already submitting or results are shown
    if (isSubmittingRef.current || results) return;
    
    if (gamePhase === 'countdown') {
      setGamePhase('guessing');
    } else if (gamePhase === 'guessing') {
      // Time's up - if no answer selected, it's already marked as wrong (empty string from initialization)
      // No need to update anything, the initial empty string is already there
      setGamePhase('reveal');
    } else if (gamePhase === 'reveal') {
      // Move to next question or finish
      if (quizData && currentQuestion < quizData.questions.length - 1) {
        setGamePhase('transition');
      } else {
        // Quiz complete - submit answers
        if (!isSubmittingRef.current) {
          isSubmittingRef.current = true;
          submitQuiz(answersRef.current);
        }
      }
    } else if (gamePhase === 'transition') {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setGamePhase('guessing');
    }
  }, [gamePhase, results, quizData, currentQuestion]);

  // Main game timer - handles all phases
  useEffect(() => {
    // Stop timer if quiz not started, results shown, exit modal open, or currently submitting
    if (!quizStarted || results || showExitModal || isSubmittingRef.current) return;

    const timer = setInterval(() => {
      setPhaseTimer((prev) => {
        if (prev <= 1) {
          handlePhaseTransition();
          return getNextPhaseDuration();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, currentQuestion, quizStarted, showExitModal, results, handlePhaseTransition, getNextPhaseDuration]);

  // Audio control - Use DOM audio element like Heardle does
  useEffect(() => {
    if (!quizData || !quizStarted) return;

    const question = quizData.questions[currentQuestion];
    if (!question.preview_url) return;

    // Only set audio src during guessing phase
    if (gamePhase === 'guessing') {
      setCurrentAudioSrc(question.preview_url);
    } else {
      setCurrentAudioSrc('');
      // Stop audio when leaving guessing phase
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [currentQuestion, gamePhase, quizData, quizStarted]);

  // Auto-play audio when src changes (like Heardle pattern)
  useEffect(() => {
    if (!audioRef.current || !currentAudioSrc) return;

    const audio = audioRef.current;
    audio.volume = siteVolume;
    
    // Ensure audio is unlocked before playing (iOS Safari fix)
    // This is the same pattern Heardle uses - unlock then play
    ensureAudioUnlocked(audio).then(() => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('Audio play failed:', err);
        });
      }
    });
  }, [currentAudioSrc, siteVolume]);

  // Update audio volume when site volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = siteVolume;
    }
  }, [siteVolume]);

  // No longer needed - we submit directly in handlePhaseTransition

  const handleAnswerSelection = (answer: string) => {
    if (!quizData || selectedAnswer || gamePhase !== 'guessing') return;

    const correct = answer === quizData.questions[currentQuestion].correct_answer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);

    /**
     * CRITICAL: Update ref directly for immediate persistence
     * - answersRef.current is mutated directly (not copied) for instant updates
     * - This ensures answers persist across React render cycles
     * - State is updated separately for UI reactivity
     */
    answersRef.current[currentQuestion] = {
      question_id: quizData.questions[currentQuestion].id,
      selected_answer: answer
    };
    
    // Sync state with ref for UI updates
    setAnswers([...answersRef.current]);
    
    console.log(`✅ Q${currentQuestion + 1} answered:`, answer, correct ? '✓' : '✗');
  };


  const submitQuiz = async (finalAnswers: Answer[]) => {
    if (!quizData) return;

    try {
      setSubmitting(true);
      
      const quizDuration = quizData.questions.length * 19 * 1000; // 19 seconds per question
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quiz_id: quizData.quiz_id,
          answers: finalAnswers,
          playlist: playlist,
          genre: genre,
          duration_ms: quizDuration
        })
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      isSubmittingRef.current = false; // Reset on error so user can retry
    }
  };

  const startQuiz = () => {
    // Unlock audio on iOS when user clicks "Start Quiz"
    // This MUST happen synchronously in the click handler for iOS
    unlockAudio();
    
    setQuizStarted(true);
    setGamePhase('countdown');
    setPhaseTimer(5);
  };

  const resetQuiz = () => {
    // Stop any playing audio but KEEP the element (for iOS unlock)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.currentTime = 0;
      // Don't set to null - keep the unlocked element!
    }
    
    setQuizData(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setResults(null);
    setQuizStarted(false);
    setGamePhase('ready');
    setPhaseTimer(5);
    setSelectedAnswer(null);
    setIsCorrect(false);
    isSubmittingRef.current = false; // Reset for new quiz
    fetchQuiz();
  };

  const handleExitQuiz = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    router.push('/play/solo');
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <QuizResults results={results} onPlayAgain={resetQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 text-center max-w-md scale-in">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-danger)] to-[var(--accent-warning)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">failed to load quiz</h1>
          <p className="text-[var(--text-secondary)] mb-6">we couldn&apos;t fetch the quiz questions. please try again.</p>
          <button 
            onClick={fetchQuiz}
            className="btn-primary px-6 py-3 rounded-2xl font-semibold"
          >
            try again
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl">
          {/* Back button */}
          <button
            onClick={() => router.push('/play/solo')}
            className="inline-flex items-center gap-2 mb-6 p-2 px-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span className="lowercase">back</span>
          </button>

          <div className="bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-3xl p-12 text-center shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            {/* Animated music icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">ready to play?</h1>
            <p className="text-[var(--text-secondary)] text-lg mb-10">
              guess the artist from 7-second previews
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-6 bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-2xl text-center hover:scale-105 transition-transform">
                <div className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] bg-clip-text text-transparent mb-2">{quizData.questions.length}</div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">songs</div>
              </div>
              
              <div className="p-6 bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-2xl text-center hover:scale-105 transition-transform">
                <div className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-success)] to-[var(--music-green)] bg-clip-text text-transparent mb-2">7s</div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">per song</div>
              </div>
          </div>
            
          <button 
            onClick={startQuiz}
              className="group relative w-full px-8 py-5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
              <span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">start quiz</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      {/* Audio Element - Use DOM element like Heardle does */}
      {currentAudioSrc && (
        <audio
          ref={audioRef}
          src={currentAudioSrc}
          onEnded={() => {
            // Auto-stop at 7 seconds handled by QuizQuestion component
          }}
        />
      )}
      
      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-3">
              exit quiz?
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-8">
              your progress will be lost and this quiz won&apos;t be saved.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 py-3 px-6 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold rounded-xl transition-all hover:scale-105 border border-[var(--bg-accent)]"
              >
                continue quiz
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                exit
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Exit Button */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleExitQuiz}
            className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--bg-accent)] rounded-lg transition-all hover:scale-105 group"
            title="Exit Quiz"
          >
            <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-danger)] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {/* Progress circles */}
          <div className="flex items-center gap-2">
            {Array.from({ length: quizData.questions.length }).map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  idx < currentQuestion
                    ? 'bg-[var(--accent-success)] text-white'
                    : idx === currentQuestion
                    ? gamePhase === 'guessing' || gamePhase === 'reveal'
                      ? 'bg-[var(--accent-primary)] text-white animate-pulse'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-2 border-[var(--bg-accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-2 border-[var(--bg-accent)]'
                }`}
              >
                {idx + 1}
            </div>
            ))}
            </div>
          </div>
          
        {/* Game Phases */}
        {gamePhase === 'countdown' && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <h2 className="text-6xl font-bold text-[var(--text-primary)] mb-8">
              round {currentQuestion + 1}/{quizData.questions.length}
            </h2>
            <div className="text-8xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] bg-clip-text text-transparent animate-pulse">
              {phaseTimer}
            </div>
            <p className="text-[var(--text-secondary)] text-xl mt-8">get ready...</p>
          </div>
        )}

        {gamePhase === 'guessing' && (
          <div className="flex flex-col items-center">
            {/* Timer */}
            <div className={`text-6xl font-bold mb-8 ${
              phaseTimer > 5 ? 'text-[var(--accent-success)]' :
              phaseTimer > 2 ? 'text-[var(--accent-warning)]' :
              'text-[var(--accent-danger)] animate-pulse'
            }`}>
              {phaseTimer}
          </div>

            {/* Artist Options */}
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestionData.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelection(option)}
                  disabled={!!selectedAnswer}
                  className={`p-6 rounded-2xl font-bold text-lg transition-all ${
                    selectedAnswer === option
                      ? isCorrect
                        ? 'bg-[var(--accent-success)] text-white scale-105'
                        : 'bg-[var(--accent-danger)] text-white scale-105'
                      : 'bg-[var(--bg-secondary)] border-2 border-[var(--bg-accent)] text-[var(--text-primary)] hover:scale-105 hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {gamePhase === 'reveal' && (
          <div className="flex flex-col items-center animate-[scaleIn_0.3s_ease-out]">
            <h2 className={`text-5xl font-bold mb-8 ${
              isCorrect ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'
            }`}>
              {isCorrect ? 'awesome!' : 'not quite...'}
            </h2>

            {/* Album Cover & Info */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-2xl p-8 mb-6 flex items-center gap-6 max-w-2xl w-full">
              {currentQuestionData.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentQuestionData.image}
                  alt={currentQuestionData.song_name || currentQuestionData.correct_answer}
                  className="w-32 h-32 rounded-lg shadow-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  {currentQuestionData.song_name || currentQuestionData.correct_answer}
                </h3>
                <p className="text-[var(--text-secondary)] text-lg">
                  {currentQuestionData.artist}
                </p>
          </div>
        </div>

            <p className="text-[var(--text-muted)]">
              next round in {phaseTimer} seconds...
            </p>
          </div>
        )}

        {gamePhase === 'transition' && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <h2 className="text-6xl font-bold text-[var(--text-primary)] mb-8">
              round {currentQuestion + 2}/{quizData.questions.length}
            </h2>
            <div className="text-8xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] bg-clip-text text-transparent animate-pulse">
              {phaseTimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QuizPageContent />
    </Suspense>
  );
}
