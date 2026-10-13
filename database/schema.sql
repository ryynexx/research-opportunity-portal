CREATE DATABASE IF NOT EXISTS research_portal_db;

USE research_portal_db;

CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    research_area VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    required_skills TEXT NOT NULL,
    available_positions INT NOT NULL,
    application_deadline DATE NOT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);