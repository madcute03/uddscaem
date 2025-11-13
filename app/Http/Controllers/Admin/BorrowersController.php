<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BorrowRequest;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\BorrowRequestStatusMail;
use App\Mail\CustomMessageMail;

class BorrowersController extends Controller
{
    public function index()
    {
        $stats = [
            'total_items' => Item::count(),
            'borrowed_items' => BorrowRequest::where('status', 'approved')->whereNull('returned_at')->count(),
            'pending_requests' => BorrowRequest::where('status', 'pending')->count(),
        ];

        $items = Item::orderBy('name')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'available' => $item->availableCount(),
            ];
        });
        $requests = BorrowRequest::with('item')->whereNull('returned_at')->orderByDesc('created_at')->take(50)->get();
        $logs = BorrowRequest::with('item')->orderByDesc('updated_at')->take(50)->get();

        return Inertia::render('Admin/Borrowers/Index', [
            'stats' => $stats,
            'items' => $items,
            'requests' => $requests,
            'logs' => $logs,
        ]);
    }

    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
        ]);
        Item::create($validated);
        return back()->with('success', 'Item added');
    }

    public function updateItem(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
        ]);
        $item->update($validated);
        return back()->with('success', 'Item updated');
    }

    public function deleteItem(Item $item)
    {
        $item->delete();
        return back()->with('success', 'Item deleted');
    }

    public function approve(Request $request, BorrowRequest $borrowRequest)
    {
        $borrowRequest->update([
            'status' => 'approved',
            'approved_at' => now(),
            'denied_at' => null,
        ]);
        if ($request->boolean('send_mail')) {
            Mail::to($borrowRequest->email)->send(new BorrowRequestStatusMail($borrowRequest->fresh('item'), 'approved', $request->string('note')->toString()));
        }
        return back()->with('success', 'Request approved');
    }

    public function deny(Request $request, BorrowRequest $borrowRequest)
    {
        $borrowRequest->update([
            'status' => 'denied',
            'denied_at' => now(),
            'approved_at' => null,
        ]);
        if ($request->boolean('send_mail')) {
            
            Mail::to($borrowRequest->email)->send(new BorrowRequestStatusMail($borrowRequest->fresh('item'), 'denied', $request->string('note')->toString()));
        }
        return back()->with('success', 'Request denied');
    }

    public function markReturned(Request $request, BorrowRequest $borrowRequest)
    {
        $borrowRequest->update([
            'returned_at' => now(),
        ]);
        if ($request->boolean('send_mail')) {
            Mail::to($borrowRequest->email)->send(new BorrowRequestStatusMail($borrowRequest->fresh('item'), 'returned', $request->string('note')->toString()));
        }
        return back()->with('success', 'Marked as returned');
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        // Send the custom message email
        Mail::to($validated['email'])->send(new CustomMessageMail($validated['email'], $validated['message']));

        return back()->with('success', 'Message sent successfully');
    }

    public function delete(BorrowRequest $borrowRequest)
    {
        $borrowRequest->delete();
        return back()->with('success', 'Borrow request deleted');
    }
}