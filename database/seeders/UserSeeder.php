<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Writer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user if it doesn't exist
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin User',
                'email_verified_at' => now(),
                'password' => Hash::make('admin123'), // Secure password
                'remember_token' => Str::random(10),
                'role' => User::ROLE_ADMIN,
            ]
        );

        // Create a test writer user
        $writer = User::firstOrCreate(
            ['email' => 'writer@example.com'],
            [
                'name' => 'Test Writer',
                'email_verified_at' => now(),
                'password' => Hash::make('writer123'),
                'remember_token' => Str::random(10),
                'role' => User::ROLE_WRITER,
            ]
        );

        // Create writer profile for the test writer
        if ($writer->wasRecentlyCreated) {
            Writer::create([
                'user_id' => $writer->id,
                'status' => Writer::STATUS_ACTIVE,
                'bio' => 'Professional content writer with 5+ years of experience',
                'specialization' => 'Technology, Business',
            ]);
        }

        $this->command->info('Users created successfully!');
        $this->command->info('Admin: admin@gmail.com / admin123');
        $this->command->info('Writer: writer@example.com / writer123');
        $this->command->warn('Please change the default passwords after first login!');
    }
}