import { Address, BigInt } from "@graphprotocol/graph-ts";
import { User } from "../../generated/schema";

export let ZERO_BI = BigInt.fromI32(0);
export let STAKING_REWARDS_ADDRESS =
  "0x2088cabfec487b2c31e478e723a06dea5c8e398b";

export function createUser(address: Address): boolean {
  let user = User.load(address.toHexString());
  if (user === null) {
    user = new User(address.toHexString());
    user.lockedBalance = ZERO_BI;
    user.earnedBalance = ZERO_BI;
    user.save();

    return true;
  }

  return false;
}
