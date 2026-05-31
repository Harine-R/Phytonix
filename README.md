# Phytonix 🌱

Phytonix is an AI-powered crop disease detection and monitoring system designed to help farmers identify plant diseases quickly and accurately.

## Features

- 📷 Upload crop leaf images
- 🤖 AI-based disease prediction
- 📊 Real-time diagnosis dashboard
- 🌿 Healthy vs Diseased crop classification
- ⚡ Fast image processing using Sharp
- 🧠 TensorFlow.js model integration

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### AI & Image Processing
- TensorFlow.js
- Sharp

### File Upload
- Multer

## Project Structure

```text
phytonix-app/
│
├── public/
│   ├── model/
│   ├── css/
│   ├── js/
│   └── assets/
│
├── uploads/
├── server.js
├── package.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Harine-R/Phytonix.git
```

Move into the project directory:

```bash
cd Phytonix
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The application will run at:

```text
http://localhost:3000
```

## How It Works

1. Upload a crop leaf image.
2. The image is processed using Sharp.
3. TensorFlow.js analyzes the image.
4. The AI model predicts the disease.
5. Results are displayed on the dashboard.

## Future Enhancements

- Weather integration
- Disease treatment recommendations
- Mobile application support
- Multi-crop disease detection
- Cloud deployment

## Author

**Harine R**

GitHub: https://github.com/Harine-R

## License

This project is developed for educational and research purposes.
