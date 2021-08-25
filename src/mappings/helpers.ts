import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  StakingRewardsDayData,
  User,
  UserRewardsDayData,
  UserRewardsMonthData,
} from "../../generated/schema";

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

  let rewardsDayID = generateID(
    STAKING_REWARDS_ADDRESS,
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

export function updateUserStakingRewardsDayData(
  user: string,
  rewardsVolumePerBlock: BigInt,
  timestamp: BigInt
): void {
  if (rewardsVolumePerBlock.equals(ZERO_BI)) return;

  let dayID = timestamp.toI32() / 86400;
  let dayStartTimestamp = dayID * 86400;

  let currentDayDataID = generateID(user, BigInt.fromI32(dayID).toString());

  let dayData = UserRewardsDayData.load(currentDayDataID);

  if (dayData === null) {
    dayData = new UserRewardsDayData(currentDayDataID);
    dayData.date = dayStartTimestamp;
    dayData.dailyRewardsVolume = ZERO_BI;
    dayData.user = user;
  }
  dayData.dailyRewardsVolume = dayData.dailyRewardsVolume.plus(
    rewardsVolumePerBlock
  );

  dayData.save();
}

export function updateUserStakingRewardsMonthData(
  user: string,
  rewardsVolumePerBlock: BigInt,
  timestamp: BigInt
): void {
  if (rewardsVolumePerBlock.equals(ZERO_BI)) return;

  let monthID = timestamp.toI32() / 2592000;
  let monthStartTimestamp = monthID * 2592000;

  let currentMonthDataID = generateID(user, BigInt.fromI32(monthID).toString());

  let monthData = UserRewardsMonthData.load(currentMonthDataID);

  if (monthData === null) {
    monthData = new UserRewardsMonthData(currentMonthDataID);
    monthData.date = monthStartTimestamp;
    monthData.monthlyRewardsVolume = ZERO_BI;
    monthData.user = user;
  }
  monthData.monthlyRewardsVolume = monthData.monthlyRewardsVolume.plus(
    rewardsVolumePerBlock
  );

  monthData.save();
}

export function generateID(name1: string, name2: string): string {
  return name1.concat("-").concat(name2);
}
