import { type AccountDto } from '@/indexer-sdk/model/accountDto'
import { BalanceAvailability, type Lock, LockType, Utils } from '@cmts-dev/carmentis-sdk-core'

export function getBalanceAvaibility(account: AccountDto) {
    const locks: Lock[] = []
    for (const lock of account.escrowLocks) {
        locks.push({
            type: LockType.Escrow,
            lockedAmountInAtomics: lock.amount,
            parameters: {
                escrowIdentifier: Utils.binaryFromHexa(lock.escrowIdentifier),
                fundEmitterAccountId: Utils.binaryFromHexa(lock.fundEmitterAccountId),
                transferAuthorizerAccountId: Utils.binaryFromHexa(lock.transferAuthorizerAccountId),
                startTimestamp: lock.startTimestamp,
                durationDays: lock.durationDays,
            }
        });
    }
    for (const lock of account.stakingLocks) {
        locks.push({
            type: LockType.NodeStaking,
            lockedAmountInAtomics: lock.amount,
            parameters: {
                validatorNodeId: Utils.binaryFromHexa(lock.validatorNodeId),
                plannedUnlockAmountInAtomics: lock.plannedSlashingAmountInAtomics,
                plannedUnlockTimestamp: lock.plannedUnlockTimestamp,
                slashed: lock.slashed,
                plannedSlashingAmountInAtomics: lock.plannedUnlockAmountInAtomics,
                plannedSlashingTimestamp: lock.plannedUnlockTimestamp,
            }
        });
    }
    for (const lock of account.vestingLocks) {
        locks.push({
            type: LockType.Vesting,
            lockedAmountInAtomics: lock.amount,
            parameters: {
                initialVestedAmountInAtomics: lock.initialVestedAmountInAtomics,
                cliffStartTimestamp: lock.cliffStartTimestamp,
                cliffDurationDays: lock.cliffDurationDays,
                vestingDurationDays: lock.vestingDurationDays,
            }
        });
    }
    return new BalanceAvailability(account.balance, locks);
}
