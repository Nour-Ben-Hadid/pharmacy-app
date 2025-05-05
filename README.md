# Pharmacy Management System

A comprehensive web application for managing pharmacy operations, prescriptions, and medication inventory.

## Overview

This pharmacy management system provides an integrated platform for pharmacists, doctors, and patients to manage prescriptions, medications, and user information. The application features role-based access with specific dashboards and capabilities for each user type.

## Features

### For Pharmacists
- Comprehensive medication inventory management
- Prescription processing and fulfillment
- Patient management
- Dashboard with key metrics and low stock alerts
- User management for pharmacy staff

### For Doctors
- Create and manage patient prescriptions
- View patient information and medication history
- Track prescription status
- Manage patient appointments

### For Patients
- View prescribed medications
- Track prescription history and status
- Access medication information and details
- Manage personal profile

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **ORM**: SQLAlchemy
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **API Client**: Axios

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 

### Backend Setup
1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv