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
        Schema::table('brackets', function (Blueprint $table) {
            // Make matches column nullable
            $table->json('matches')->nullable()->change();
            // Add new columns for the tournament structure
            $table->integer('game_number')->nullable();
            $table->integer('round')->nullable();
            $table->unsignedBigInteger('home_team_id')->nullable();
            $table->unsignedBigInteger('visitor_team_id')->nullable();
            $table->integer('home_score')->default(0);
            $table->integer('visitor_score')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brackets', function (Blueprint $table) {
            // Remove the new columns
            $table->dropColumn([
                'game_number',
                'round',
                'home_team_id',
                'visitor_team_id',
                'home_score',
                'visitor_score'
            ]);
            // Make matches column required again
            $table->json('matches')->nullable(false)->change();
        });
    }
};
