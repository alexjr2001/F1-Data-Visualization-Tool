# F1 Data Visualization tool

## Description
An interactive web platform that leverages new advanced D3.js visualizations to analyze Formula 1 performance. The goal is to identify underperformance in drivers and understand the reasons behind it through unconventional analysis tools.

## Purpose
To efficiently identify and break down underperformance issues in Formula 1 drivers. This project stems from my previous repository, [F1PredictionML-DNN](https://github.com/alexjr2001/F1PredictionML-DNN), which focused on predicting race positions using deep neural networks but faced limitations due to outdated and incomplete datasets. As a result, I decided to create an updatable dataset, now available on Kaggle ([Formula 1 Dataset - Race Data and Telemetry](https://www.kaggle.com/datasets/alexjr2001/formula-1-dataset-race-data-and-telemetry)), and use this data to build a visualization tool aimed at identifying performance issues and their root causes.

## Target Audience
This project is designed for developers, Formula 1 enthusiasts, and professionals working in or aspiring to work in the Formula 1 industry.

---

## Features
1. **Race Loading**: Select a specific race to analyze.
2. **Driver Comparison**: Choose drivers and compare their performance.
3. **Sector Analysis (Main Chart)**: Focus on specific straights and corners, highlighting performance indices. Click on a sector to generate detailed visualizations of that section.

---

## Technologies Used
### Frontend
- **HTML, CSS, JS**
- **D3.js** for interactive visualizations
- **Tailwind CSS** for styling
- **Swiper.js** for navigation
- **Flowbite** for UI components

### Backend
- **Flask** for the web server
- **Flask-CORS** for cross-origin resource sharing
- **FastF1 API** for accessing Formula 1 data

---

## Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/f1-data-visualization.git
   ```
2. Navigate to the project directory:
   ```bash
   cd F1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   cd page
   python app.py
   ```
5. Open the `index.html` file in your browser using a live server (e.g., VS Code Live Server extension).

### Notes
- No `.env` file or API keys are required.
- Ensure the dataset is in the `2024` folder.

---

## Dataset
The data used in this project was preprocessed using Jupyter Notebooks to generate dataframes, later exported as CSV files. The dataset is published on Kaggle and includes the raw data along with the notebooks used to update and preprocess it.

### Kaggle Dataset
[Formula 1 Dataset - Race Data and Telemetry](https://www.kaggle.com/datasets/alexjr2001/formula-1-dataset-race-data-and-telemetry)

---

## How to Run (Same as mentioned in installation section)
1. Start the backend server:
   ```bash
   python app.py
   ```
2. Open the frontend in your browser using a live server:
   - Recommended: VS Code Live Server extension.

---

## Contributions
Contributions are welcome! The project is currently paused and will be actively resumed in April 2025. In the meantime, you can check the `Issues` tab to find tasks where you can contribute.

Feel free to fork the repository, create a branch for your changes, and submit a pull request.

---

## License
This project is shared under the Creative Commons BY-NC License. It is intended for educational and demonstrative purposes. Commercial use of this code, dataset, or visualizations is strictly prohibited. Contributions are welcome via issues or pull requests!
