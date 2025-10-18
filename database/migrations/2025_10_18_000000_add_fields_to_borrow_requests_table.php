<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('borrow_requests', function (Blueprint $table) {
            $table->longText('purpose')->nullable()->after('item_id');
            $table->integer('quantity')->default(1)->after('purpose');
            $table->string('contact_number')->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('borrow_requests', function (Blueprint $table) {
            $table->dropColumn(['purpose', 'quantity', 'contact_number']);
        });
    }
};
