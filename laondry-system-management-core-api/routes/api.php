<?php

use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LoginWithEmailController;
use App\Http\Controllers\Auth\VerifyLoginOtpController;
use App\Http\Controllers\Auth\ForgotPinController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPinController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\RefreshTokenController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\ChangePinController;
use App\Http\Controllers\Auth\ResendVerificationController;
use App\Http\Controllers\Auth\ResendOtpController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\ListSessionsController;
use App\Http\Controllers\Auth\RevokeSessionController;
use App\Http\Controllers\Auth\LogoutAllController;
use App\Http\Controllers\UserManagement\UserManagementController;
use App\Http\Controllers\StaffManagement\StaffManagementController;
use App\Http\Controllers\UserProfile\UserProfileController;
use App\Http\Controllers\UserProfile\UserAddressController;
use App\Http\Controllers\Outlet\OutletController;
use App\Http\Controllers\ServiceCategory\ServiceCategoryController;
use App\Http\Controllers\Service\ServiceController;
use App\Http\Controllers\Service\ServiceAddonController;
use App\Http\Controllers\Addon\AddonController;
use App\Http\Controllers\ServicePrice\ServicePriceController;
use App\Http\Controllers\OrderStatus\OrderStatusController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Order\OrderStatusController as OrderStatusUpdateController;
use App\Http\Controllers\Quote\QuoteController;
use App\Http\Controllers\Report\ReportsController;
use App\Http\Controllers\Mobile\OutletController as MOutlet;
use App\Http\Controllers\Mobile\ServiceCategoryController as MSCat;
use App\Http\Controllers\Mobile\ServiceController as MService;
use App\Http\Controllers\Mobile\ServicePriceController as MPrice;
use App\Http\Controllers\Mobile\QuoteController as MQuote;
use App\Http\Controllers\Mobile\OrderController as MOrder;
use App\Http\Controllers\Mobile\TrackController as MTrack;
use App\Http\Controllers\Mobile\ProfileController as MProfile;
use App\Http\Controllers\Mobile\HomeController as MHome;
use App\Http\Controllers\Lookup\LookupController as Lookup;
use App\Http\Controllers\Customer\CustomerController;


Route::prefix('v1')
    ->middleware([])
    ->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/login', LoginController::class);
            Route::post('/register', RegisterController::class);
            Route::post('/login-email', LoginWithEmailController::class);
            Route::post('/verify-otp', VerifyLoginOtpController::class);
            Route::post('/forgot-password', ForgotPasswordController::class);
            Route::post('/reset-password', ResetPasswordController::class);
            Route::post('/forgot-pin', ForgotPinController::class);
            Route::post('/reset-pin', ResetPinController::class);

            Route::post('/resend-verification', ResendVerificationController::class);
        });
        Route::prefix('auth')->middleware('auth.jwt')->group(function () {
            Route::post('/refresh-token', RefreshTokenController::class);
            Route::post('/change-password', ChangePasswordController::class);
            Route::post('/change-pin', ChangePinController::class);
            Route::post('/logout', LogoutController::class);
            Route::post('/resend-otp', ResendOtpController::class)->middleware('throttle:3,1');
            Route::get('/sessions', ListSessionsController::class);
            Route::post('/sessions/revoke', RevokeSessionController::class);
            Route::post('/logout-all', LogoutAllController::class);
        });

        Route::prefix('user-profile')->middleware('auth.jwt')->group(function () {
            Route::get('/me', [UserProfileController::class, 'me']);
            Route::patch('/me', [UserProfileController::class, 'update']);
            Route::patch('/me/avatar', [UserProfileController::class, 'updateAvatar']);
            Route::delete('/me/avatar', [UserProfileController::class, 'removeAvatar']);
            Route::get('me/member-tier', [MProfile::class, 'memberTier']);
            Route::put('me/default-outlet', [MProfile::class, 'setDefaultOutlet']);

            Route::prefix('/me')->group(function () {
                Route::get('/addresses', [UserAddressController::class, 'index']);
                Route::get('/addresses/{id}', [UserAddressController::class, 'show']);
                Route::post('/addresses', [UserAddressController::class, 'store']);
                Route::patch('/addresses/{id}', [UserAddressController::class, 'update']);
                Route::delete('/addresses/{id}', [UserAddressController::class, 'destroy']);
                Route::post('/addresses/{id}/primary', [UserAddressController::class, 'setPrimary']);
            });
        });

        Route::prefix('user-management')->middleware('role:admin')->group(function () {
            Route::get('/', [UserManagementController::class, 'index']);
            Route::post('/', [UserManagementController::class, 'store']);
            Route::get('{id}', [UserManagementController::class, 'show']);
            Route::put('{id}', [UserManagementController::class, 'update']);
            Route::delete('{id}', [UserManagementController::class, 'destroy']);
            Route::post('{id}/restore', [UserManagementController::class, 'restore']);
            Route::post('{id}/ban', [UserManagementController::class, 'ban']);
            Route::post('{id}/unban', [UserManagementController::class, 'unban']);
        });

        Route::prefix('staff-management')
            ->middleware('role:admin')
            ->group(function () {
                Route::get('/', [StaffManagementController::class, 'index']);
                Route::post('/', [StaffManagementController::class, 'store']);
                Route::get('{id}', [StaffManagementController::class, 'show']);
                Route::put('{id}', [StaffManagementController::class, 'update']);
                Route::delete('{id}', [StaffManagementController::class, 'destroy']);
                Route::post('{id}/restore', [StaffManagementController::class, 'restore']);
                Route::post('{id}/ban', [StaffManagementController::class, 'ban']);
                Route::post('{id}/unban', [StaffManagementController::class, 'unban']);
            });

        Route::prefix('customers')
            ->group(function () {
                Route::get('/', [CustomerController::class, 'index']);
                Route::post('/', [CustomerController::class, 'store']);
                Route::get('{customer}', [CustomerController::class, 'show']);
                Route::match(['put', 'patch'], '{customer}', [CustomerController::class, 'update']);
                Route::delete('{customer}', [CustomerController::class, 'destroy']);
                Route::post('{id}/restore', [CustomerController::class, 'restore']);
                Route::post('{customer}/ban', [CustomerController::class, 'ban']);
                Route::post('{customer}/unban', [CustomerController::class, 'unban']);
                Route::patch('{customer}/balance', [CustomerController::class, 'adjustBalance']);
                Route::get('{customer}/orders', [CustomerController::class, 'orders']);
                Route::get('{customer}/statistics', [CustomerController::class, 'statistics']);
            });

        Route::prefix('outlets')
            ->group(function () {
                Route::get('/', [OutletController::class, 'index']);
                Route::post('/', [OutletController::class, 'store']);
                Route::get('/{outlet}', [OutletController::class, 'show']);
                Route::match(['put', 'patch'], '/{outlet}', [OutletController::class, 'update']);
                Route::delete('/{outlet}', [OutletController::class, 'destroy']);
                Route::patch('/{outlet}/activate', [OutletController::class, 'activate']);
            });

        Route::prefix('service-categories')
            ->group(function () {
                Route::get('/', [ServiceCategoryController::class, 'index']);
                Route::post('/', [ServiceCategoryController::class, 'store']);
                Route::get('/{category}', [ServiceCategoryController::class, 'show']);
                Route::match(['put', 'patch'], '/{category}', [ServiceCategoryController::class, 'update']);
                Route::delete('/{category}', [ServiceCategoryController::class, 'destroy']);
                Route::patch('/{category}/activate', [ServiceCategoryController::class, 'activate']);
            });

        Route::prefix('service')
            ->group(function () {
                Route::get('/', [ServiceController::class, 'index']);
                Route::post('/', [ServiceController::class, 'store']);
                Route::get('/{service}', [ServiceController::class, 'show']);
                Route::match(['put', 'patch'], '/{service}', [ServiceController::class, 'update']);
                Route::delete('/{service}', [ServiceController::class, 'destroy']);
                Route::patch('/{service}/activate', [ServiceController::class, 'activate']);

                Route::get('/{service}/addons', [ServiceAddonController::class, 'index']);
                Route::put('/{service}/addons', [ServiceAddonController::class, 'sync']);
                Route::post('/{service}/addons/{addon}', [ServiceAddonController::class, 'attach']);
                Route::delete('/{service}/addons/{addon}', [ServiceAddonController::class, 'detach']);
            });

        Route::prefix('addons')
            ->group(function () {
                Route::get('/', [AddonController::class, 'index']);
                Route::post('/', [AddonController::class, 'store']);
                Route::get('/{addon}', [AddonController::class, 'show']);
                Route::match(['put', 'patch'], '/{addon}', [AddonController::class, 'update']);
                Route::delete('/{addon}', [AddonController::class, 'destroy']);
                Route::patch('/{addon}/activate', [AddonController::class, 'activate']);
            });

        Route::prefix('services/{service}')->group(function () {
            Route::get('addons',        [ServiceAddonController::class, 'index']);
            Route::post('addons',       [ServiceAddonController::class, 'store']);
            Route::patch('addons/{addon}', [ServiceAddonController::class, 'update']);
            Route::delete('addons/{addon}', [ServiceAddonController::class, 'destroy']);
        });

        Route::prefix('service-prices')
            ->group(function () {
                Route::get('/', [ServicePriceController::class, 'index']);
                Route::post('/', [ServicePriceController::class, 'store']);
                Route::get('/{price}', [ServicePriceController::class, 'show']);
                Route::match(['put', 'patch'], '/{price}', [ServicePriceController::class, 'update']);
                Route::delete('/{price}', [ServicePriceController::class, 'destroy']);

                Route::post('/bulk', [ServicePriceController::class, 'bulk']);
            });

        Route::prefix('order-statuses')
            ->group(function () {
                Route::get('/', [OrderStatusController::class, 'index']);
                Route::post('/', [OrderStatusController::class, 'store']);
                Route::get('/{code}', [OrderStatusController::class, 'show']);
                Route::match(['put', 'patch'], '/{code}', [OrderStatusController::class, 'update']);
                Route::delete('/{code}', [OrderStatusController::class, 'destroy']);
            });


        Route::prefix('orders')
            ->group(function () {
                Route::get('/', [OrderController::class, 'index']);
                Route::post('/', [OrderController::class, 'store']);
                Route::get('/{order}', [OrderController::class, 'show']);
                Route::match(['put', 'patch'], '/{order}', [OrderController::class, 'update']);
                Route::delete('/{order}', [OrderController::class, 'destroy']);

                Route::post('/{order}/items', [OrderController::class, 'addItem']);
                Route::match(['put', 'patch'], '/{order}/items/{item}', [OrderController::class, 'updateItem']);
                Route::delete('/{order}/items/{item}', [OrderController::class, 'deleteItem']);

                Route::post('/{order}/items/{item}/addons', [OrderController::class, 'addItemAddon']);
                Route::match(['put', 'patch'], '/{order}/items/{item}/addons/{addonRow}', [OrderController::class, 'updateItemAddon']);
                Route::delete('/{order}/items/{item}/addons/{addonRow}', [OrderController::class, 'deleteItemAddon']);

                Route::post('/{order}/recalc', [OrderController::class, 'recalc']);
                Route::post('/{order}/override-totals', [OrderController::class, 'overrideTotals']);
                Route::post('/{order}/change-status', [OrderController::class, 'changeStatus']);
                Route::post('/{order}/status', [OrderStatusUpdateController::class, 'updateStatus']); // For payment webhook
                Route::get('/{order}/timeline', [OrderController::class, 'timeline']);
                Route::get('/{order}/print', [OrderController::class, 'printData']);
            });

        Route::prefix('quote')
            ->middleware(['role:admin'])
            ->group(function () {
                Route::post('/', [QuoteController::class, 'quote']);
            });

        Route::prefix('report')
            ->group(function () {
                Route::get('/dashboard', [ReportsController::class, 'dashboard']);
                Route::get('/revenue', [ReportsController::class, 'revenue']);
                Route::get('/service-usage', [ReportsController::class, 'serviceUsage']);
                Route::get('/turnaround', [ReportsController::class, 'turnaround']);
                Route::get('/customers', [ReportsController::class, 'customers']);
            });

        Route::prefix('mobile')
            ->middleware('auth.jwt')
            ->group(function () {
                // Home Dashboard
                Route::get('home/dashboard', [MHome::class, 'dashboard']);

                // Catalog
                Route::get('outlets', [MOutlet::class, 'index']);
                Route::get('service-categories', [MSCat::class, 'index']);
                Route::get('services', [MService::class, 'index']);
                Route::get('services/{service}', [MService::class, 'show']);
                Route::get('services/{service}/addons', [MService::class, 'addons']);

                // Prices & Quote
                Route::get('service-prices', [MPrice::class, 'effective']); // query
                // Route::post('quote', [MQuote::class, 'quote']);

                // Orders
                // Route::prefix('orders')->group(function () {
                //     Route::get('/', [MOrder::class, 'index']);
                //     Route::post('/', [MOrder::class, 'store']);
                //     Route::get('/{order}', [MOrder::class, 'show']);
                //     Route::post('/{order}/cancel', [MOrder::class, 'cancel']);
                //     Route::get('/{order}/timeline', [MOrder::class, 'timeline']);
                //     Route::post('/{order}/confirm-ready', [MOrder::class, 'confirmReady']);
                //     Route::post('/{order}/request-delivery', [MOrder::class, 'requestDelivery']);
                //     Route::get('/track/{order_no}', [MTrack::class, 'track']);
                // });
            });

        Route::prefix('lookups')->group(function () {
            Route::get('order-statuses', [Lookup::class, 'orderStatuses']);
            Route::get('pricing-models', [Lookup::class, 'pricingModels']);
            Route::get('member-tiers', [Lookup::class, 'memberTiers']);
        });
    });
