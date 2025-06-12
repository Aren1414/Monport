export const POINTS_RULES = {
  mintNFT: 50,  
  referral: 100,  
  swap: 10,    
  deployNFT: 75,  
  mintAfterDeploy: 15,  
  creatorMintBonus: 30,  
};

export function calculatePoints(action: keyof typeof POINTS_RULES): number {
  return POINTS_RULES[action] || 0;
}
