<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('registered_players', function (Blueprint $table) {
            // Drop the old foreign key constraint if it exists
            if (Schema::hasColumn('registered_players', 'event_registration_id')) {
                $table->dropForeign(['event_registration_id']);
                $table->dropColumn('event_registration_id');
            }

            // Add the new columns if they don't exist
            if (!Schema::hasColumn('registered_players', 'event_id')) {
                $table->foreignId('event_id')->after('id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('registered_players', 'email')) {
                $table->string('email')->after('name');
            }
            if (!Schema::hasColumn('registered_players', 'gdrive_link')) {
                $table->string('gdrive_link')->nullable()->after('age');
            }
            if (!Schema::hasColumn('registered_players', 'status')) {
                $table->string('status')->default('pending')->after('gdrive_link');
            }
        });
    }

    public function down()
    {
        Schema::table('registered_players', function (Blueprint $table) {
            // Reverse the changes if needed
            $table->dropForeign(['event_id']);
            $table->dropColumn(['event_id', 'email', 'gdrive_link', 'status']);
            
            // Add back the old column if needed
            if (!Schema::hasColumn('registered_players', 'event_registration_id')) {
                $table->foreignId('event_registration_id')->after('id')->constrained('event_registrations')->onDelete('cascade');
            }
        });
    }
};
