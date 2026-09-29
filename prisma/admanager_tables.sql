-- CreateTable
CREATE TABLE IF NOT EXISTS `sellers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `shop_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sellers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `seller_wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seller_id` INTEGER NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seller_wallets_seller_id_key`(`seller_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seller_id` INTEGER NOT NULL,
    `type` ENUM('TOPUP', 'CPC_DEDUCTION', 'REFUND') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(500) NULL,
    `reference_id` VARCHAR(255) NULL,
    `balance_before` DECIMAL(10, 2) NOT NULL,
    `balance_after` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wallet_transactions_seller_id_idx`(`seller_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seller_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ENDED', 'BUDGET_EXHAUSTED') NOT NULL DEFAULT 'ACTIVE',
    `bidding_strategy` ENUM('FIXED', 'DYNAMIC_DOWN', 'DYNAMIC_UP_DOWN') NOT NULL DEFAULT 'FIXED',
    `daily_budget` DECIMAL(10, 2) NOT NULL,
    `total_budget` DECIMAL(10, 2) NULL,
    `spent_today` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_spent` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `campaigns_seller_id_idx`(`seller_id`),
    INDEX `campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `keyword` VARCHAR(255) NOT NULL,
    `match_type` ENUM('EXACT', 'PHRASE', 'BROAD') NOT NULL DEFAULT 'BROAD',
    `max_cpc_bid` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `keywords_campaign_id_idx`(`campaign_id`),
    INDEX `keywords_keyword_idx`(`keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `negative_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `keyword` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `negative_keywords_campaign_id_idx`(`campaign_id`),
    INDEX `negative_keywords_keyword_idx`(`keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `product_id` VARCHAR(255) NOT NULL,
    `headline` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NULL,
    `image_url` VARCHAR(1000) NULL,
    `target_url` VARCHAR(1000) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ads_campaign_id_idx`(`campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `impressions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `ad_id` INTEGER NOT NULL,
    `keyword_matched` VARCHAR(255) NULL,
    `placement` VARCHAR(100) NULL,
    `buyer_session_id` VARCHAR(255) NULL,
    `auction_rank` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `impressions_campaign_id_idx`(`campaign_id`),
    INDEX `impressions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `ad_id` INTEGER NOT NULL,
    `keyword_id` INTEGER NULL,
    `keyword_matched` VARCHAR(255) NULL,
    `cpc_charged` DECIMAL(10, 2) NOT NULL,
    `buyer_session_id` VARCHAR(255) NULL,
    `ip_hash` VARCHAR(64) NULL,
    `impression_token` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clicks_campaign_id_idx`(`campaign_id`),
    INDEX `clicks_created_at_idx`(`created_at`),
    INDEX `clicks_ip_hash_idx`(`ip_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `conversions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `ad_id` INTEGER NOT NULL,
    `click_id` INTEGER NOT NULL,
    `order_id` VARCHAR(255) NOT NULL,
    `order_value` DECIMAL(10, 2) NOT NULL,
    `buyer_session_id` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversions_campaign_id_idx`(`campaign_id`),
    INDEX `conversions_click_id_idx`(`click_id`),
    INDEX `conversions_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
