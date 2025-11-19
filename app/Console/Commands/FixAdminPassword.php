<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class FixAdminPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:fix-password';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix admin user password hashing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = 'admin@gmail.com';
        $password = 'admin123';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }

        // Update password with proper hashing
        $user->password = Hash::make($password);
        $user->save();

        $this->info("✅ Password successfully updated for {$email}");
        $this->warn("Password: {$password}");
        $this->warn("⚠️  Please change this password after logging in!");

        return 0;
    }
}
