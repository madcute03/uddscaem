# SEMS - Sports Event Management System

[![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Inertia.js](https://img.shields.io/badge/Inertia-000000?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## About SEMS

SEMS (Sports Event Management System) is a comprehensive platform for managing sports events, teams, and news. Built with Laravel, React, Inertia.js, and Tailwind CSS, it provides a modern and responsive interface for both administrators and users.

## Features

- Event Management
- Team Registration
- News and Announcements
- User Authentication
- Responsive Design
- Admin Dashboard

## Prerequisites

- PHP >= 8.1
- Composer
- Node.js >= 16.0.0
- NPM >= 8.0.0
- MySQL >= 5.7 or MariaDB >= 10.3

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sems.git
   cd sems
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

5. **Generate application key**
   ```bash
   php artisan key:generate
   ```

6. **Configure database**
   Update your `.env` file with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database_name
   DB_USERNAME=your_database_username
   DB_PASSWORD=your_database_password
   ```

7. **Run database migrations and seeders**
   ```bash
   php artisan migrate --seed
   ```

8. **Build assets**
   ```bash
   npm run build
   ```

9. **Start the development server**
   ```bash
   php artisan serve
   ```

10. **Access the application**
    Open your browser and visit: [http://localhost:8000](http://localhost:8000)

## Development

- Run Vite development server (for hot module replacement):
  ```bash
  npm run dev
  ```

- Build assets for production:
  ```bash
  npm run build
  ```

## Testing

Run the tests with:
```bash
php artisan test
```

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open-source and licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Credits

- Built with [Laravel](https://laravel.com)
- Frontend powered by [React](https://reactjs.org/) and [Inertia.js](https://inertiajs.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
