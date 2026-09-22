# CodeCollab – Real-Time Collaborative Code Editor

A web-based collaborative coding workspace where multiple users can edit code in real time, communicate through team chat, switch between programming languages, and execute code directly from the browser.

## 🚀 Live Demo

**[Open CodeCollab](http://13.206.179.206:3000)**

## 📌 Features

- Real-time collaborative code editing
- Multiple users in the same workspace
- Real-time participant presence
- Team chat
- Multi-language support
  - JavaScript
  - Python
  - Java
  - C++
  - C
  - Go
- Shared language selection across connected users
- Monaco Editor for code editing
- Code execution with Judge0
- Dockerized application
- Deployed on AWS EC2
- Docker image stored in Amazon ECR
- Elastic IP for a persistent public address
- Automatic Docker container restart

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Monaco Editor
- Tailwind CSS
- Yjs
- y-monaco
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- y-socket.io

### Code Execution
- Judge0 CE

### DevOps & Cloud
- Docker
- Amazon ECR
- Amazon EC2
- AWS IAM
- Elastic IP

## 🏗️ Architecture

```text
                ┌──────────────────────┐
                │      Web Browser     │
                │   React + Monaco     │
                └──────────┬───────────┘
                           │
                           │ HTTP / WebSocket
                           ▼
                ┌──────────────────────┐
                │    Docker Container  │
                │   Node.js + Express  │
                │     Socket.IO        │
                │      Yjs / ySocket   │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │      AWS EC2         │
                │   CodeCollab Server  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │      Amazon ECR      │
                │    Docker Image      │
                └──────────────────────┘

Browser ───────────────► Judge0 CE
        Code Execution
```

## 📂 Project Structure
DOCKER-AWS/
│
├── Backend/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   └── App.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .dockerignore
├── .gitignore
├── dockerfile
└── README.md

👩‍💻 Author

Mousumi Badyakar
