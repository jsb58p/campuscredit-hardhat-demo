const { ethers } = require("hardhat");
// Optional: for context printing only
const TOKEN = "<PASTE_DEPLOYED_ADDRESS_FROM_DEPLOY>";
const HASHES = {
tx1: "0x17844e8760c781a613c305f41ac189d8f635ef9b3f95b739d8ef5d40d1955a66",
tx2: "0xdb8b3dfd5ee61bb3ce71fd4b8a659cafba107c4d4d2100ca2befc909e2e94a18",
tx3: "0x33e6ece6386e86597a4dabdd186781071669a538e54232fd9be9e3438dadb7ac",
};
const iface = new ethers.Interface([
"event Transfer(address indexed from, address indexed to, uint256 value)",
"event Approval(address indexed owner, address indexed spender, uint256 value)",
]);
async function analyze(hash) {
const tx = await ethers.provider.getTransaction(hash);
const rcpt = await ethers.provider.getTransactionReceipt(hash);
const block = await ethers.provider.getBlock(rcpt.blockNumber);
const baseFee = block.baseFeePerGas ?? 0n;
const gasUsed = rcpt.gasUsed ?? 0n;
const effective = rcpt.effectiveGasPrice ?? tx.gasPrice ?? 0n;
const totalFee = gasUsed * effective;
console.log("\n=== Analysis for", hash, "===");
console.log("Status:", rcpt.status === 1 ? "Success" : "Fail");
console.log("Block number:", rcpt.blockNumber);
console.log("Timestamp (UTC):", new Date(Number(block.timestamp) *
1000).toISOString());
console.log("From:", tx.from);
console.log("To:", tx.to);
console.log("Nonce:", tx.nonce);
console.log("Gas limit:", tx.gasLimit?.toString());
console.log("Gas used:", gasUsed.toString());
console.log("Base fee per gas:", baseFee.toString());
console.log("Max fee per gas:", (tx.maxFeePerGas ?? 0n).toString());
console.log("Max priority fee per gas:", (tx.maxPriorityFeePerGas ??
0n).toString());
console.log("Effective gas price:", effective.toString());
console.log("Total fee (wei):", totalFee.toString());
// Decode Transfer/Approval events
for (const log of rcpt.logs) {
try {
const parsed = iface.parseLog({ topics: log.topics, data:
log.data });
// Pretty print decoded values
if (parsed.name === "Transfer" || parsed.name === "Approval") {
const args = parsed.args;
const val = args.value ? ethers.formatUnits(args.value, 18) :
"";
console.log(`Event: ${parsed.name}`, {
from: args.from ?? args.owner,
to: args.to ?? args.spender,
valueRaw: args.value?.toString(),
valueHuman: val,
});
} else {
console.log("Event:", parsed.name, parsed.args);
}
} catch (_) { /* Ignore logs from other contracts */ }
}
}
async function main() {
console.log("Token (context):", TOKEN);
await analyze(HASHES.tx1);
await analyze(HASHES.tx2);
await analyze(HASHES.tx3);
}
main().catch((e) => {
console.error(e);
process.exit(1);
});
