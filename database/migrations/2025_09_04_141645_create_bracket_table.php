<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('brackets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->json('matches'); // store matches as JSON
            $table->string('champion')->nullable();
            $table->timestamps();
                $table->integer('team_players')->nullable(); // or 'bracket_size'


            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('brackets');
    }
};
