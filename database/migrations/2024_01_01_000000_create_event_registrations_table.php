<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('event_registrations')) {
            Schema::create('event_registrations', function (Blueprint $table) {
                $table->id();
                $table->string('event_name');
                $table->date('event_date');
                $table->string('bracket_type');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
