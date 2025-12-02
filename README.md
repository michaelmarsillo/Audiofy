# 🎵 Audiofy

A music trivia game where players guess artists from 7-second song previews. Built with real-time multiplayer and a global leaderboard.

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 💭 The Story

My family used to play a song quiz trivia game at the cottage, sitting around the fire or in the living room, enjoying drinks and shouting out answers. When the game got discontinued, I became inspired to build Audiofy to bring that experience back and expand on it.

The **Arcade** mode is the most accurate representation of how the original game used to flow (minus the voice prompts and shouting). I then added a **multiplayer mode** with web sockets, a daily **Heardle** (inspired by Wordle), and a **global leaderboard** to make it even better.

## ✨ Features

- **Solo Play** - Test your music knowledge across different genres
- **Heardle** - Daily music guessing game with progressive audio unlocking
- **Arcade** - Family/Party mode with 80s/90s hits (closest to the original game)
- **Play with Friends** - Real-time multiplayer with up to 8 players
- **Global Leaderboard** - Compete across all game modes

## 🛠️ Tech Stack

**Frontend:**
- Next.js
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Hosted on Vercel

**Backend:**
- Node.js + Express
- Socket.IO
- PostgreSQL + Neon 
- JWT Authentication
- Hosted on Render

**APIs:**
- iTunes Search API

## 🎮 Quick Overview

- **Solo Play**: 7 questions, 100 points per correct answer
- **Heardle**: Daily challenge with progressive audio unlocks
- **Arcade**: 7 rounds with discussion phases (80s/90s focus)
- **Multiplayer**: Real-time gameplay with points, time bonuses, and streaks

## 📝 Notes

Planning to write a blog post about the technical implementation once I fully implement the web sockets. Until then, feel free to explore the codebase

---

**Built with ❤️ for music lovers everywhere**

*Made by [Michael Marsillo](https://www.linkedin.com/in/michaelmarsillo/)*
