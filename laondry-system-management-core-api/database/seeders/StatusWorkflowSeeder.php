<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderService\OrderStatus;
use App\Models\OrderService\StatusWorkflowTemplate;
use App\Models\OrderService\StatusWorkflowStep;
use App\Models\OrderService\StatusTransition;

class StatusWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Order Statuses
        $this->seedOrderStatuses();

        // 2. Seed Workflow Templates
        $this->seedWorkflowTemplates();

        // 3. Seed Status Transitions
        $this->seedStatusTransitions();
    }

    private function seedOrderStatuses()
    {
        $statuses = [
            [
                'code' => 'PENDING_PAYMENT',
                'name' => 'Menunggu Pembayaran',
                'description' => 'Order telah dibuat, menunggu pembayaran dari customer',
                'color' => '#FFA500',
                'icon' => 'payment',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'PAYMENT_CONFIRMED',
                'name' => 'Pembayaran Dikonfirmasi',
                'description' => 'Pembayaran telah dikonfirmasi, order siap diproses',
                'color' => '#4CAF50',
                'icon' => 'check_circle',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'PROCESSING',
                'name' => 'Sedang Diproses',
                'description' => 'Order sedang dalam proses',
                'color' => '#2196F3',
                'icon' => 'autorenew',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'WASHING',
                'name' => 'Sedang Dicuci',
                'description' => 'Cucian sedang dalam proses pencucian',
                'color' => '#00BCD4',
                'icon' => 'local_laundry_service',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'DRYING',
                'name' => 'Sedang Dikeringkan',
                'description' => 'Cucian sedang dalam proses pengeringan',
                'color' => '#FF9800',
                'icon' => 'wb_sunny',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'IRONING',
                'name' => 'Sedang Disetrika',
                'description' => 'Cucian sedang dalam proses penyetrikaan',
                'color' => '#9C27B0',
                'icon' => 'iron',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'QUALITY_CHECK',
                'name' => 'Pengecekan Kualitas',
                'description' => 'Cucian sedang dilakukan pengecekan kualitas',
                'color' => '#673AB7',
                'icon' => 'verified',
                'is_final' => false,
                'is_visible_to_customer' => false,
            ],
            [
                'code' => 'READY',
                'name' => 'Siap Diambil',
                'description' => 'Cucian sudah selesai dan siap diambil/dikirim',
                'color' => '#4CAF50',
                'icon' => 'done_all',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'ON_DELIVERY',
                'name' => 'Sedang Dikirim',
                'description' => 'Cucian sedang dalam pengiriman ke customer',
                'color' => '#FF5722',
                'icon' => 'local_shipping',
                'is_final' => false,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'COMPLETED',
                'name' => 'Selesai',
                'description' => 'Order telah selesai dan diserahkan ke customer',
                'color' => '#4CAF50',
                'icon' => 'check_circle',
                'is_final' => true,
                'is_visible_to_customer' => true,
            ],
            [
                'code' => 'CANCELLED',
                'name' => 'Dibatalkan',
                'description' => 'Order dibatalkan',
                'color' => '#F44336',
                'icon' => 'cancel',
                'is_final' => true,
                'is_visible_to_customer' => true,
            ],
        ];

        foreach ($statuses as $status) {
            OrderStatus::updateOrCreate(
                ['code' => $status['code']],
                $status
            );
        }
    }

    private function seedWorkflowTemplates()
    {
        // Template 1: Cuci + Setrika (Full Service)
        $washAndIron = StatusWorkflowTemplate::updateOrCreate(
            ['code' => 'WASH_AND_IRON'],
            [
                'name' => 'Cuci + Setrika',
                'description' => 'Workflow untuk layanan cuci dan setrika lengkap',
                'is_active' => true,
            ]
        );

        $washAndIronSteps = [
            ['status_code' => 'PENDING_PAYMENT', 'step_order' => 1, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'PAYMENT_CONFIRMED', 'step_order' => 2, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'WASHING', 'step_order' => 3, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'DRYING', 'step_order' => 4, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'IRONING', 'step_order' => 5, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'QUALITY_CHECK', 'step_order' => 6, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'READY', 'step_order' => 7, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'ON_DELIVERY', 'step_order' => 8, 'is_required' => false, 'is_skippable' => true],
            ['status_code' => 'COMPLETED', 'step_order' => 9, 'is_required' => true, 'is_skippable' => false],
        ];

        foreach ($washAndIronSteps as $step) {
            StatusWorkflowStep::updateOrCreate(
                [
                    'workflow_template_id' => $washAndIron->id,
                    'status_code' => $step['status_code'],
                ],
                array_merge($step, ['workflow_template_id' => $washAndIron->id])
            );
        }

        // Template 2: Cuci Kering (Wash Only)
        $washOnly = StatusWorkflowTemplate::updateOrCreate(
            ['code' => 'WASH_ONLY'],
            [
                'name' => 'Cuci Kering',
                'description' => 'Workflow untuk layanan cuci kering tanpa setrika',
                'is_active' => true,
            ]
        );

        $washOnlySteps = [
            ['status_code' => 'PENDING_PAYMENT', 'step_order' => 1, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'PAYMENT_CONFIRMED', 'step_order' => 2, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'WASHING', 'step_order' => 3, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'DRYING', 'step_order' => 4, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'QUALITY_CHECK', 'step_order' => 5, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'READY', 'step_order' => 6, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'ON_DELIVERY', 'step_order' => 7, 'is_required' => false, 'is_skippable' => true],
            ['status_code' => 'COMPLETED', 'step_order' => 8, 'is_required' => true, 'is_skippable' => false],
        ];

        foreach ($washOnlySteps as $step) {
            StatusWorkflowStep::updateOrCreate(
                [
                    'workflow_template_id' => $washOnly->id,
                    'status_code' => $step['status_code'],
                ],
                array_merge($step, ['workflow_template_id' => $washOnly->id])
            );
        }

        // Template 3: Setrika Aja (Iron Only)
        $ironOnly = StatusWorkflowTemplate::updateOrCreate(
            ['code' => 'IRON_ONLY'],
            [
                'name' => 'Setrika Saja',
                'description' => 'Workflow untuk layanan setrika saja',
                'is_active' => true,
            ]
        );

        $ironOnlySteps = [
            ['status_code' => 'PENDING_PAYMENT', 'step_order' => 1, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'PAYMENT_CONFIRMED', 'step_order' => 2, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'IRONING', 'step_order' => 3, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'QUALITY_CHECK', 'step_order' => 4, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'READY', 'step_order' => 5, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'ON_DELIVERY', 'step_order' => 6, 'is_required' => false, 'is_skippable' => true],
            ['status_code' => 'COMPLETED', 'step_order' => 7, 'is_required' => true, 'is_skippable' => false],
        ];

        foreach ($ironOnlySteps as $step) {
            StatusWorkflowStep::updateOrCreate(
                [
                    'workflow_template_id' => $ironOnly->id,
                    'status_code' => $step['status_code'],
                ],
                array_merge($step, ['workflow_template_id' => $ironOnly->id])
            );
        }

        // Template 4: Dry Clean (Premium Service)
        $dryClean = StatusWorkflowTemplate::updateOrCreate(
            ['code' => 'DRY_CLEAN'],
            [
                'name' => 'Dry Clean',
                'description' => 'Workflow untuk layanan dry clean premium',
                'is_active' => true,
            ]
        );

        $dryCleanSteps = [
            ['status_code' => 'PENDING_PAYMENT', 'step_order' => 1, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'PAYMENT_CONFIRMED', 'step_order' => 2, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'PROCESSING', 'step_order' => 3, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'QUALITY_CHECK', 'step_order' => 4, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'READY', 'step_order' => 5, 'is_required' => true, 'is_skippable' => false],
            ['status_code' => 'ON_DELIVERY', 'step_order' => 6, 'is_required' => false, 'is_skippable' => true],
            ['status_code' => 'COMPLETED', 'step_order' => 7, 'is_required' => true, 'is_skippable' => false],
        ];

        foreach ($dryCleanSteps as $step) {
            StatusWorkflowStep::updateOrCreate(
                [
                    'workflow_template_id' => $dryClean->id,
                    'status_code' => $step['status_code'],
                ],
                array_merge($step, ['workflow_template_id' => $dryClean->id])
            );
        }
    }

    private function seedStatusTransitions()
    {
        $transitions = [
            // From PENDING_PAYMENT
            ['from_status' => 'PENDING_PAYMENT', 'to_status' => 'PAYMENT_CONFIRMED'],
            ['from_status' => 'PENDING_PAYMENT', 'to_status' => 'CANCELLED'],

            // From PAYMENT_CONFIRMED
            ['from_status' => 'PAYMENT_CONFIRMED', 'to_status' => 'PROCESSING'],
            ['from_status' => 'PAYMENT_CONFIRMED', 'to_status' => 'WASHING'],
            ['from_status' => 'PAYMENT_CONFIRMED', 'to_status' => 'IRONING'],
            ['from_status' => 'PAYMENT_CONFIRMED', 'to_status' => 'CANCELLED'],

            // From PROCESSING
            ['from_status' => 'PROCESSING', 'to_status' => 'QUALITY_CHECK'],
            ['from_status' => 'PROCESSING', 'to_status' => 'CANCELLED'],

            // From WASHING
            ['from_status' => 'WASHING', 'to_status' => 'DRYING'],
            ['from_status' => 'WASHING', 'to_status' => 'CANCELLED'],

            // From DRYING
            ['from_status' => 'DRYING', 'to_status' => 'IRONING'],
            ['from_status' => 'DRYING', 'to_status' => 'QUALITY_CHECK'],
            ['from_status' => 'DRYING', 'to_status' => 'CANCELLED'],

            // From IRONING
            ['from_status' => 'IRONING', 'to_status' => 'QUALITY_CHECK'],
            ['from_status' => 'IRONING', 'to_status' => 'CANCELLED'],

            // From QUALITY_CHECK
            ['from_status' => 'QUALITY_CHECK', 'to_status' => 'READY'],
            ['from_status' => 'QUALITY_CHECK', 'to_status' => 'WASHING'], // Re-wash if quality issue
            ['from_status' => 'QUALITY_CHECK', 'to_status' => 'IRONING'], // Re-iron if quality issue

            // From READY
            ['from_status' => 'READY', 'to_status' => 'ON_DELIVERY'],
            ['from_status' => 'READY', 'to_status' => 'COMPLETED'], // Direct pickup

            // From ON_DELIVERY
            ['from_status' => 'ON_DELIVERY', 'to_status' => 'COMPLETED'],
            ['from_status' => 'ON_DELIVERY', 'to_status' => 'READY'], // Return to outlet if delivery failed
        ];

        foreach ($transitions as $transition) {
            StatusTransition::updateOrCreate(
                [
                    'from_status' => $transition['from_status'],
                    'to_status' => $transition['to_status'],
                ],
                array_merge($transition, ['is_active' => true])
            );
        }
    }
}
