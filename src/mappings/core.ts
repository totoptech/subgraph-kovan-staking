import {
  StakeCall,
  Withdrawn as WithdrawnEvent,
  StakingRewards as StakingRewardsContract,
} from "../../generated/templates/StakingRewards/StakingRewards";
import {
  StakingRewardsData,
  User,
  UserRewardsBlockData,
  UserTransaction,
} from "../../generated/schema";
import {
  createOrLoadUser,
  generateID,
  STAKING_REWARDS_ADDRESS,
  START_BLOCK,
  updateStakingRewardsDayData,
  updateUserStakingRewardsDayData,
  updateUserStakingRewardsMonthData,
  ZERO_BI,
} from "./helpers";
import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

export function handleStake(call: StakeCall): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  if (stakingRewards === null) {
    stakingRewards = new StakingRewardsData(STAKING_REWARDS_ADDRESS);
    stakingRewards.totalStakingVolume = ZERO_BI;
    stakingRewards.stakers = [];
    stakingRewards.totalStakersCount = 0;
  }

  let user = createOrLoadUser(call.from);

  if (user.lockedBalance.equals(ZERO_BI)) {
    stakingRewards.stakers = stakingRewards.stakers.concat([user.id]);
    stakingRewards.totalStakersCount++;
  }

  let amount = call.inputs.amount;

  user.lockedBalance = user.lockedBalance.plus(amount);

  user.save();

  stakingRewards.totalStakingVolume = stakingRewards.totalStakingVolume.plus(
    amount
  );

  stakingRewards.save();

  let timestamp = call.block.timestamp;

  // Save UserTransaction

  let userTransaction = new UserTransaction(
    generateID(call.from.toHexString(), timestamp.toString())
  );

  userTransaction.user = call.from.toHexString();
  userTransaction.amount = amount;
  userTransaction.timestamp = timestamp;
  userTransaction.save();

  // Update day data
  updateStakingRewardsDayData(
    true,
    timestamp,
    amount,
    stakingRewards.totalStakingVolume
  );
}

export function handleWithdraw(event: WithdrawnEvent): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  let userAddress = event.params.user.toHexString();
  let user = User.load(userAddress);

  let amount = event.params.amount;

  user.lockedBalance = user.lockedBalance.minus(amount);

  user.save();

  if (user.lockedBalance.equals(ZERO_BI)) {
    let stakers = stakingRewards.stakers;
    let temp: string[] = [];
    for (let i = 0; i < stakers.length; i++) {
      if (stakers[i] != user.id) {
        temp = temp.concat([stakers[i]]);
      }
    }

    stakingRewards.stakers = temp;
    stakingRewards.totalStakersCount--;
  }

  stakingRewards.totalStakingVolume = stakingRewards.totalStakingVolume.minus(
    amount
  );

  stakingRewards.save();

  let timestamp = event.block.timestamp;

  // Save UserTransaction

  let userTransaction = new UserTransaction(
    generateID(userAddress, timestamp.toString())
  );

  userTransaction.user = userAddress;
  userTransaction.amount = ZERO_BI.minus(amount);
  userTransaction.timestamp = timestamp;
  userTransaction.save();

  updateStakingRewardsDayData(
    false,
    timestamp,
    amount,
    stakingRewards.totalStakingVolume
  );
}

export function handleBlock(block: ethereum.Block): void {
  if (block.number.equals(START_BLOCK)) {
    // Create a new one for starting.
    updateStakingRewardsDayData(true, block.timestamp, ZERO_BI, ZERO_BI);
  }

  let stakingRewardsContract = StakingRewardsContract.bind(
    Address.fromString(STAKING_REWARDS_ADDRESS)
  );
  let blockNumber = block.number;

  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  if (stakingRewards === null) return;

  let stakers = stakingRewards.stakers;

  for (let i = 0; i < stakers.length; i++) {
    let currentRewardsVolume = stakingRewardsContract.earned(
      Address.fromString(stakers[i])
    );

    let previousBlockID = generateID(
      stakers[i],
      blockNumber.minus(BigInt.fromI32(1)).toString()
    );

    let currentBlockID = generateID(stakers[i], blockNumber.toString());

    let previousBlock = UserRewardsBlockData.load(previousBlockID);
    let rewardsVolmePerBlock = currentRewardsVolume;

    if (previousBlock !== null && !currentRewardsVolume.equals(ZERO_BI)) {
      rewardsVolmePerBlock = rewardsVolmePerBlock.minus(
        previousBlock.totalRewardsVolume
      );
    }

    let currentBlock = new UserRewardsBlockData(currentBlockID);
    currentBlock.rewardsVolumePerBlock = rewardsVolmePerBlock;
    currentBlock.totalRewardsVolume = currentRewardsVolume;
    currentBlock.user = stakers[i];
    currentBlock.timestamp = block.timestamp;
    currentBlock.blockNumber = blockNumber;
    currentBlock.save();

    updateUserStakingRewardsDayData(
      stakers[i],
      rewardsVolmePerBlock,
      block.timestamp
    );

    updateUserStakingRewardsMonthData(
      stakers[i],
      rewardsVolmePerBlock,
      block.timestamp
    );
  }
}
