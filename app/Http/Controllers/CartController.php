<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Cart/Index', $this->cartData($request));
    }

    public function store(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->is_active, 404);
        abort_if($product->availableStock() < 1, 422, 'این محصول در حال حاضر موجود نیست.');

        $quantity = max(1, (int) $request->input('quantity', 1));
        $mode = $this->normalizePurchaseMode($product, (string) $request->input('purchase_mode', 'download'));
        $cart = $this->cart($request);
        $nextQuantity = ($cart[$product->id] ?? 0) + $quantity;
        $cart[$product->id] = min($nextQuantity, $product->availableStock());
        $this->saveCart($request, $cart);
        $modes = $this->cartModes($request);
        $modes[$product->id] = $mode;
        $this->saveCartModes($request, $modes);

        return redirect()->route('cart.index')->with('success', 'محصول به سبد خرید اضافه شد.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);
        $cart = $this->cart($request);
        $available = $product->availableStock();

        if (isset($cart[$product->id]) && $available > 0) {
            $cart[$product->id] = min((int) $validated['quantity'], $available);
            $this->saveCart($request, $cart);
        }

        return back()->with('success', 'تعداد محصول به‌روزرسانی شد.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $cart = $this->cart($request);
        unset($cart[$product->id]);
        $this->saveCart($request, $cart);
        $modes = $this->cartModes($request);
        unset($modes[$product->id]);
        $this->saveCartModes($request, $modes);

        return back()->with('success', 'محصول از سبد خرید حذف شد.');
    }

    public function checkout(Request $request): RedirectResponse
    {
        $cart = $this->cart($request);
        if ($cart === []) {
            return redirect()->route('cart.index')->with('error', 'سبد خرید شما خالی است.');
        }

        $user = $request->user();
        $cartModes = $this->cartModes($request);
        $order = DB::transaction(function () use ($user, $cart, $cartModes) {
            $products = Product::query()
                ->where('is_active', true)
                ->whereIn('id', array_keys($cart))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $items = collect($cart)->map(function ($quantity, $productId) use ($products, $cartModes) {
                $product = $products->get((int) $productId);
                $quantity = (int) $quantity;
                $mode = $this->normalizePurchaseMode($product, (string) ($cartModes[(int) $productId] ?? 'download'));
                $pricing = $this->pricingFor($product, $mode);

                abort_unless($product && $product->availableStock() >= $quantity, 422, 'موجودی یکی از محصولات تغییر کرده است. سبد خرید را بررسی کنید.');

                return [
                    'product' => $product,
                    'quantity' => $quantity,
                    'mode' => $mode,
                    'price' => $pricing['price'],
                    'discount_price' => $pricing['discount_price'],
                    'unit_price' => $pricing['final_price'],
                    'total' => $pricing['final_price'] * $quantity,
                ];
            })->values();

            $subtotal = (int) $items->sum(fn ($item) => $item['price'] * $item['quantity']);
            $total = (int) $items->sum('total');
            $isFree = $total === 0;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'status' => $isFree ? 'paid' : 'pending',
                'subtotal' => $subtotal,
                'discount' => $subtotal - $total,
                'total' => $total,
                'payment_method' => $isFree ? 'free' : null,
                'paid_at' => $isFree ? now() : null,
                'reservation_expires_at' => $isFree ? null : now()->addMinutes((int) config('commerce.reservation_minutes', 30)),
                'billing' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
            ]);

            foreach ($items as $item) {
                /** @var Product $product */
                $product = $item['product'];
                $order->items()->create([
                    'purchasable_type' => Product::class,
                    'purchasable_id' => $product->id,
                    'title' => $product->title,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total' => $item['total'],
                    'purchase_mode' => $item['mode'],
                ]);
                $product->increment('reserved_stock', $item['quantity']);
            }

            if ($isFree) {
                $this->finalizeProductItems($order);
            }

            return $order;
        });

        $request->session()->forget(['cart', 'cart_modes']);

        if ($order->status === 'paid') {
            return redirect()->route('dashboard.orders')->with('success', 'سفارش رایگان شما با موفقیت ثبت شد.');
        }

        return redirect()->route('checkout.show', ['order' => $order->order_number]);
    }

    /** @return array{items: \Illuminate\Support\Collection, totals: array{subtotal: int, discount: int, total: int}} */
    private function cartData(Request $request): array
    {
        $cart = $this->cart($request);
        if ($cart === []) {
            return ['items' => collect(), 'totals' => ['subtotal' => 0, 'discount' => 0, 'total' => 0]];
        }

        $products = Product::active()->whereIn('id', array_keys($cart))->get()->keyBy('id');
        $cartModes = $this->cartModes($request);
        $items = collect($cart)->map(function ($quantity, $productId) use ($products, $cartModes) {
            $product = $products->get((int) $productId);
            $available = $product?->availableStock() ?? 0;
            if (! $product || $available < 1) {
                return null;
            }

            $quantity = min((int) $quantity, $available);
            $mode = $this->normalizePurchaseMode($product, (string) ($cartModes[(int) $productId] ?? 'download'));
            $pricing = $this->pricingFor($product, $mode);

            return [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'type' => $product->type,
                'image' => $product->image,
                'price' => $pricing['price'],
                'discount_price' => $pricing['discount_price'],
                'final_price' => $pricing['final_price'],
                'purchase_mode' => $mode,
                'purchase_mode_label' => $mode === 'download' ? 'نسخه دانلودی' : 'مطالعه آنلاین',
                'quantity' => $quantity,
                'total' => $pricing['final_price'] * $quantity,
                'stock' => $available,
            ];
        })->filter()->values();

        $subtotal = (int) $items->sum(fn ($item) => $item['price'] * $item['quantity']);
        $total = (int) $items->sum('total');

        return [
            'items' => $items,
            'totals' => [
                'subtotal' => $subtotal,
                'discount' => $subtotal - $total,
                'total' => $total,
            ],
        ];
    }

    /** @return array<int, int> */
    private function cart(Request $request): array
    {
        return collect($request->session()->get('cart', []))
            ->mapWithKeys(fn ($quantity, $productId) => [(int) $productId => max(1, (int) $quantity)])
            ->all();
    }

    /** @return array<int, string> */
    private function cartModes(Request $request): array
    {
        return collect($request->session()->get('cart_modes', []))
            ->mapWithKeys(fn ($mode, $productId) => [(int) $productId => (string) $mode])
            ->all();
    }

    /** @param array<int, int> $cart */
    private function saveCart(Request $request, array $cart): void
    {
        $request->session()->put('cart', $cart);
    }

    /** @param array<int, string> $modes */
    private function saveCartModes(Request $request, array $modes): void
    {
        $request->session()->put('cart_modes', $modes);
    }

    private function normalizePurchaseMode(?Product $product, string $mode): string
    {
        if ($mode !== 'online' && $mode !== 'download') {
            $mode = 'download';
        }

        if ($mode === 'download' && $product && ! $product->hasDownloadEdition()) {
            return 'online';
        }

        return $mode;
    }

    /** @return array{price: int, discount_price: ?int, final_price: int} */
    private function pricingFor(?Product $product, string $mode): array
    {
        if (! $product) {
            return ['price' => 0, 'discount_price' => null, 'final_price' => 0];
        }

        if ($mode === 'download' && $product->hasDownloadEdition()) {
            $price = (int) ($product->download_price ?? $product->price);
            $discount = $product->download_discount_price;

            return ['price' => $price, 'discount_price' => $discount, 'final_price' => (int) ($discount ?? $price)];
        }

        return ['price' => (int) $product->price, 'discount_price' => $product->discount_price, 'final_price' => $product->finalPrice()];
    }

    private function finalizeProductItems(Order $order): void
    {
        $order->loadMissing('items');
        foreach ($order->items->where('purchasable_type', Product::class) as $item) {
            $product = Product::query()->lockForUpdate()->find($item->purchasable_id);
            if (! $product) {
                continue;
            }

            $product->decrement('stock', min((int) $item->quantity, (int) $product->stock));
            $product->decrement('reserved_stock', min((int) $item->quantity, (int) $product->reserved_stock));
        }
    }
}
