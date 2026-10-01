import fs from 'node:fs/promises';
const root='src/components/sites/web3-magne-ai-9982170f/root-8a5edab2/';
async function replace(file,pairs){let text=await fs.readFile(root+file,'utf8');for(const [a,b]of pairs){if(!text.includes(a))throw new Error(`Missing text in ${file}: ${a}`);text=text.split(a).join(b);}await fs.writeFile(root+file,text);}
await replace('Hero.tsx',[
 ['Building the Next Generation High-Performance Blockchain Foundation!','Explore MAGNE.AI’s hardware and Web3 ecosystem.'],
 ['Powering tools and integrations from companies all around the world','Explore product information, network documentation, and developer resources.'],
 ['START BUILDING','VIEW DOCUMENTATION']
]);
await replace('Adoption.tsx',[
 ['Made for mass adoption.','Network documentation.'],
 ['Live data','Developer resources'],
 ['{"Fast"}','{"Network configuration"}'],
 ["Don't keep your users waiting. MAGNE.AI has block times of 400 milliseconds — and as hardware gets faster, so will the network.",'Review network identifiers and connection settings in the developer documentation. Check the network environment before connecting.'],
 ['Transactions per second','NETWORK SETTINGS'],
 ['{"Scalable"}','{"Transactions and fees"}'],
 ['Get big, quick. MAGNE.AI is made to handle thousands of transactions per second, and fees for both developers and users remain less than $0.0025.','Consult the documentation for transaction setup. Fees and confirmation times depend on the network environment and current conditions.'],
 ['Total transactions','TRANSACTION INFORMATION'],
 ['{"Decentralized"}','{"Validation and security"}'],
 ['The MAGNE.AI network is validated by thousands of nodes that operate independently of each other, ensuring your data remains secure and censorship resistant.','Review the documented network architecture and security model. No network or application can eliminate every security risk.'],
 ['Validator nodes','NETWORK ARCHITECTURE'],
 ['{"Energy Efficient"}','{"Developer tools"}'],
 ['MAGNE focuses on efficiency through protocol and infrastructure optimizations across L1/L2 and execution tooling. Energy characteristics may vary by network configuration and workload. Methodology and benchmark notes are available through controlled due diligence.','Explore the available developer documentation and check the requirements of each tool before use.'],
 ['Net carbon impact','DOCUMENTATION']
]);
await replace('Growth.tsx',[
 ['Build for growth.','Hardware & Web3 resources.'],
 ['alt={"payment-magne"}','alt={"Concept illustration of a device and shopping cart; not a MAGNE.AI device photograph"}'],
 ['MAGNE.AI is built for worldwide deployment, with full 5G support and carrier compatibility across major regions. Whether for travel, international users, or global Web3 applications, MAGNE.AI ensures seamless network access and regulatory compliance.','Explore MAGNE.AI product information and Web3 documentation. Refer to the relevant device specifications for supported features. Network compatibility depends on the device variant, supported bands, carrier, and region.'],
 ['href={"https://payment.MAGNE.AI/buy"}','href={"https://web3.magne.ai/learning/what-is-magne"}'],
 ['PAYMENTS ON MAGNE.AI','EXPLORE DOCUMENTATION'],
 ['className={"flex-1 p-8 md:p-12 flex flex-col justify-center "}','className={"flex-1 p-8 md:p-12 flex flex-col justify-center "}'],
 ['<div className={"flex items-center mb-4"}>','<p className="concept-label">Concept illustration. Not a photograph of a MAGNE.AI device.</p><div className={"flex items-center mb-4"}>']
]);
await replace('CommunityGallery.tsx',[
 ['800+','Community'],['New York Event','Photo archive'],['48,000','Connect'],['Developers building during MAGNE.AI','Explore the MAGNE.AI community'],['Hackathons',''],['1,000+','Explore'],['Kuala Lumpur Event','Community moments'],['Hacker House','Community archive photograph']
]);
await replace('CommunityHeading.tsx',[['Join a thriving community.','Connect with the community.']]);
await replace('JoinCommunity.tsx',[
 ["It's time to join the thousands ",'Explore the documentation'],['of creators, builders, and ','and connect with the'],['developers using ',''],['START BUILDING','EXPLORE GITHUB'],['{"."}','{" community."}']
]);
