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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('coordinator_name');
            $table->string('image_path')->nullable();
            $table->dateTime('event_date');
            $table->dateTime('registration_end_date')->nullable(); // added here
            $table->boolean('has_registration_end_date')->default(true);
            $table->boolean('is_done')->default(false); 
            $table->unsignedTinyInteger('required_players')->nullable();
            $table->timestamps();
        });

        Schema::create('event_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_images'); // drop child table first
        Schema::dropIfExists('events');       // then drop parent table
    }
};
