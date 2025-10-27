<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained()->onDelete('cascade');
            $table->integer('round'); // Round number (1, 2, 3, etc.)
            $table->integer('match_number'); // Match number within the round
            $table->foreignId('team1_id')->nullable()->constrained('teams')->onDelete('set null');
            $table->foreignId('team2_id')->nullable()->constrained('teams')->onDelete('set null');
            $table->foreignId('winner_id')->nullable()->constrained('teams')->onDelete('set null');
            $table->foreignId('next_match_id')->nullable()->constrained('matches')->onDelete('set null');
            $table->integer('team1_score')->nullable();
            $table->integer('team2_score')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
