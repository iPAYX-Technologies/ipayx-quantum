// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IpayxRegistry
 * @notice On-chain registry for referencing iPayX off-chain payment IDs
 * @dev This contract does NOT handle funds - it only provides a verifiable on-chain reference
 *      to off-chain payments for dApps that need to correlate blockchain events with iPayX transactions.
 */
contract IpayxRegistry {
    /// @notice Emitted when a payment is referenced on-chain
    /// @param payer Address that created the reference
    /// @param paymentId Off-chain iPayX payment identifier
    /// @param timestamp Block timestamp of the reference
    event PaymentReferenced(
        address indexed payer,
        string paymentId,
        uint256 timestamp
    );

    /// @notice Maps payment IDs to the address that referenced them
    mapping(string => address) public paymentPayer;

    /// @notice Maps payment IDs to the timestamp they were referenced
    mapping(string => uint256) public paymentTimestamp;

    /// @notice Counter for total payments referenced
    uint256 public totalPaymentsReferenced;

    /// @notice Error thrown when attempting to reference an already-referenced payment
    error PaymentAlreadyReferenced(string paymentId);

    /**
     * @notice Create an on-chain reference to an off-chain iPayX payment
     * @param paymentId The iPayX payment identifier (e.g., "pmt_abc123")
     * @dev This creates a permanent, verifiable on-chain record that can be used to:
     *      - Prove that msg.sender initiated a specific iPayX payment
     *      - Correlate smart contract events with off-chain payment events
     *      - Enable on-chain logic based on off-chain payment confirmation (via oracle/webhook)
     */
    function referencePayment(string calldata paymentId) external {
        if (paymentPayer[paymentId] != address(0)) {
            revert PaymentAlreadyReferenced(paymentId);
        }

        paymentPayer[paymentId] = msg.sender;
        paymentTimestamp[paymentId] = block.timestamp;
        totalPaymentsReferenced++;

        emit PaymentReferenced(msg.sender, paymentId, block.timestamp);
    }

    /**
     * @notice Check if a payment has been referenced and by whom
     * @param paymentId The payment identifier to check
     * @return referenced True if the payment has been referenced
     * @return payer Address that referenced the payment (address(0) if not referenced)
     * @return timestamp When the payment was referenced (0 if not referenced)
     */
    function getPaymentReference(string calldata paymentId) 
        external 
        view 
        returns (
            bool referenced, 
            address payer, 
            uint256 timestamp
        ) 
    {
        payer = paymentPayer[paymentId];
        timestamp = paymentTimestamp[paymentId];
        referenced = payer != address(0);
    }

    /**
     * @notice Verify that a specific address referenced a specific payment
     * @param paymentId The payment identifier
     * @param expectedPayer The address to verify
     * @return True if expectedPayer referenced the payment
     */
    function verifyPayer(string calldata paymentId, address expectedPayer) 
        external 
        view 
        returns (bool) 
    {
        return paymentPayer[paymentId] == expectedPayer;
    }
}
