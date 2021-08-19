import { Address, BigInt } from "@graphprotocol/graph-ts";
import { StakingRewardsDayData, User } from "../../generated/schema";

export let ZERO_BI = BigInt.fromI32(0);
export let STAKING_REWARDS_ADDRESS =
  "0x48ce557a201222bba020afdc9e92b9af9872ed0a";

export function createOrLoadUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (user === null) {
    user = new User(address.toHexString());
    user.lockedBalance = ZERO_BI;
    user.earnedBalance = ZERO_BI;
    user.save();
  }

  return user as User;
}

export function updateStakingRewardsDayData(
  isStaking: boolean,
  timestamp: BigInt,
  amount: BigInt,
  totalStakingVolume: BigInt
): void {
  let dayID = timestamp.toI32() / 86400;
  let dayStartTimestamp = dayID * 86400;

  let rewardsDayID = STAKING_REWARDS_ADDRESS.concat("-").concat(
    BigInt.fromI32(dayID).toString()
  );

  let rewardsDayData = StakingRewardsDayData.load(rewardsDayID);

  if (rewardsDayData === null) {
    rewardsDayData = new StakingRewardsDayData(rewardsDayID);
    rewardsDayData.date = dayStartTimestamp;
    rewardsDayData.dailyStakingVolume = ZERO_BI;
    rewardsDayData.totalStakingVolume = ZERO_BI;
  }

  if (isStaking)
    rewardsDayData.dailyStakingVolume = rewardsDayData.dailyStakingVolume.plus(
      amount
    );
  else
    rewardsDayData.dailyStakingVolume = rewardsDayData.dailyStakingVolume.minus(
      amount
    );

  rewardsDayData.totalStakingVolume = totalStakingVolume;

  rewardsDayData.save();
}
