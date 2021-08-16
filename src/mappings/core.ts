import {
  StakedCall
  Withdrawn as WithdrawnEvent,
} from "../../generated/templates/StakingRewards/StakingRewards";
import { StakingRewardsData, User } from "../../generated/schema";
import { createUser, STAKING_REWARDS_ADDRESS, ZERO_BI } from "./helpers";

export function handleStake(call: ): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  let isNewUser = createUser(event.params.user);

  if (isNewUser) stakingRewards.totalStakers++;

  stakingRewards.totalStakingVolume.plus(event.params.amount);

  stakingRewards.save();
}

export function handleWithdraw(event: WithdrawnEvent): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);

  stakingRewards.totalStakers--;

  let user = User.load(event.params.user.toHexString());

  user.lockedBalance = ZERO_BI;

  user.save();

  stakingRewards.totalStakingVolume.minus(event.params.amount);

  stakingRewards.save();
}

export function handleDeploy(): void {
  let stakingRewards = StakingRewardsData.load(STAKING_REWARDS_ADDRESS);
  if (stakingRewards === null) {
    stakingRewards = new StakingRewardsData(STAKING_REWARDS_ADDRESS);
    stakingRewards.totalStakingVolume = ZERO_BI;
    stakingRewards.totalStakers = ZERO_BI;
  }
}
