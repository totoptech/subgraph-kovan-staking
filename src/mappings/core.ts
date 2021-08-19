import {
  StakeCall,
  Withdrawn as WithdrawnEvent,
} from "../../generated/templates/StakingRewards/StakingRewards";
import { StakingRewardsData, User } from "../../generated/schema";
import {
  createOrLoadUser,
  STAKING_REWARDS_ADDRESS,
  updateStakingRewardsDayData,
  ZERO_BI,
} from "./helpers";
import { BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

export function handleStake(call: StakeCall): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  if (stakingRewards === null) {
    stakingRewards = new StakingRewardsData(STAKING_REWARDS_ADDRESS);
    stakingRewards.totalStakingVolume = ZERO_BI;
    stakingRewards.totalStakers = 0;
    stakingRewards.stakers = [];
  }

  let user = createOrLoadUser(call.from);

  if (user.lockedBalance.equals(ZERO_BI)) {
    stakingRewards.totalStakers++;
    stakingRewards.stakers = stakingRewards.stakers.concat([user.id]);
  }

  let amount = call.inputs.amount;

  user.lockedBalance = user.lockedBalance.plus(amount);

  user.save();

  stakingRewards.totalStakingVolume = stakingRewards.totalStakingVolume.plus(
    amount
  );

  stakingRewards.save();

  updateStakingRewardsDayData(
    true,
    call.block.timestamp,
    amount,
    stakingRewards.totalStakingVolume
  );
}

export function handleWithdraw(event: WithdrawnEvent): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  let user = User.load(event.params.user.toHexString());

  let amount = event.params.amount;

  user.lockedBalance = user.lockedBalance.minus(amount);

  user.save();

  if (user.lockedBalance.equals(ZERO_BI)) {
    let stakers = stakingRewards.stakers;
    for (let i = 0; i < stakers.length; i++) {
      if (stakers[i] == user.id) {
        stakingRewards.stakers = stakers.splice(i, 1);
        log.info("I am user2: {}", [user.id]);

        break;
      }
    }

    stakingRewards.totalStakers--;
  }

  stakingRewards.totalStakingVolume = stakingRewards.totalStakingVolume.minus(
    amount
  );

  stakingRewards.save();

  updateStakingRewardsDayData(
    false,
    event.block.timestamp,
    amount,
    stakingRewards.totalStakingVolume
  );
}

export function handleBlock(block: ethereum.Block): void {}
