# 🎵 Audiofy

A full-stack music trivia game where players test their music knowledge by guessing artists from 7-second song previews. Features multiple game modes, real-time multiplayer, and a global leaderboard system.

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ✨ Features

### 🎮 Game Modes

- **Solo Play**: Test your music knowledge with 7 questions from your favorite genres
- **Heardle**: Daily music guessing game with progressive audio unlocking
- **Arcade**: Family-friendly mode with 80s/90s hits and discussion phases
- **Play with Friends**: Real-time multiplayer mode with up to 8 players

### 🏆 Leaderboard System

- **Global Leaderboard**: Combined scores from Solo Play and Multiplayer
- **Solo Leaderboard**: Track your solo play performance
- **Multiplayer Leaderboard**: Compete with friends in multiplayer games
- **Personal Stats**: View your rank, total score, games played, and more

### 🎯 Key Features

- Real-time multiplayer gameplay with Socket.IO
- Points-based scoring system with streaks and bonuses
- Multiple music genres (Gen-Z Hip-Hop, 80s Hits, 90s Hits)
- Beautiful dark theme UI with vibrant gradients
- Responsive design for mobile, tablet, and desktop
- User authentication and guest play support
- Global volume control
- Smooth animations and transitions

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time multiplayer communication
- **React Context** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### APIs
- **iTunes Search API** - Music track data and previews


## 📁 Project Structure

```
audiofy/
├── frontend/
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx     # Home page
│   │   ├── quiz/         # Solo play mode
│   │   ├── play/         # Game mode selection
│   │   │   ├── solo/     # Solo play
│   │   │   ├── heardle/  # Heardle mode
│   │   │   ├── arcade/   # Arcade mode
│   │   │   └── friends/  # Multiplayer mode
│   │   ├── leaderboard/  # Leaderboard page
│   │   ├── about/        # About page
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth)
│   └── public/           # Static assets
│
├── backend/
│   ├── server.js         # Express server & Socket.IO
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   └── audioService.js
│   ├── middleware/       # Express middleware
│   │   └── auth.js
│   ├── scripts/          # Database scripts
│   │   ├── migrate-leaderboard.js
│   │   └── test-leaderboard.js
│   └── db.js             # Database connection
│
└── README.md
```

## 🎮 Game Modes Explained

### Solo Play
- 7 questions per game
- 7-second audio previews
- Multiple choice artist selection
- 100 points per correct answer
- Multiple genres available

### Heardle
- Daily song challenge
- Progressive audio unlocking (1s, 2s, 4s, 7s, 15s, 30s)
- Search bar with autofill
- Win/loss tracking
- Next Heardle countdown

### Arcade
- Family-friendly mode
- 7 rounds per game
- 5s countdown → 10s audio → 7s discussion → 7s reveal
- 80s/90s music focus
- Settings modal for genre selection

### Play with Friends (Multiplayer)
- Real-time multiplayer with Socket.IO
- Up to 8 players per room
- Room code system
- 7 rounds per game
- Points system: Base (250) + Time Bonus (up to 70) + Streak Bonus (50 × streak)
- Live scoreboard updates
- Game over screen with rankings

## 🏆 Scoring System

### Solo Play
- **Base**: 100 points per correct answer
- **Max per game**: 700 points (7/7 correct)

### Multiplayer
- **Base**: 250 points per correct answer
- **Time Bonus**: Up to 70 points (based on time remaining)
- **Streak Bonus**: 50 points × (streak - 1)
- **Max per game**: ~4,340 points (perfect game with max bonuses)

### Global Leaderboard
- **Total Audiofy Score** = Solo Total + Multiplayer Total
- Rewards players who excel in both modes

## 🔐 Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Guest play supported (scores not tracked)
- Protected routes for user stats



## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Michael Marsillo**
- GitHub: [@michaelmarsillo](https://github.com/michaelmarsillo)
- LinkedIn: [michaelmarsillo](https://www.linkedin.com/in/michaelmarsillo/) 
- Blog: [michaelmarsillo.ca/blog](https://michaelmarsillo.ca/blog)

## 🙏 Acknowledgments

- iTunes Search API for music data
- All the artists whose music makes this game possible
- The open-source community

---

**Built with ❤️ for music lovers everywhere**

