-- Run once on the existing ad-manager database.
-- 1) Check for duplicates first; this must return no rows before step 2 will succeed.
SELECT `type`, `reference_id`, COUNT(*) AS n
FROM `wallet_transactions`
WHERE `reference_id` IS NOT NULL
GROUP BY `type`, `reference_id`
HAVING n > 1;

-- 2) Enforce one wallet entry per payment/charge reference (blocks double top-up credit).
ALTER TABLE `wallet_transactions`
  ADD UNIQUE INDEX `wallet_transactions_type_reference_id_key` (`type`, `reference_id`);
