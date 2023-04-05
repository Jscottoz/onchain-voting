// TODO: OnchainVoting
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useEffect, useState } from "react";

import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
} from "@project-serum/anchor";
import idl from "../onchain_voting.json";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.metadata.address);


export const OnchainVoting: FC = () => {
  const ourWallet = useWallet();
  const { connection } = useConnection();

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      ourWallet,
      AnchorProvider.defaultOptions()
    );
    return provider;
  };

  async function initVoteBank(voteAccount: PublicKey, signer: PublicKey): Promise<void> {
    try {
      const program = new Program(idl_object, programId, getProvider());
  
      const [voteBank] = await PublicKey.findProgramAddressSync(
        [Buffer.from("votebank")],
        programId
      );
  
      const transaction = new Transaction().add(
        new TransactionInstruction({
          keys: [
            { pubkey: voteAccount, isSigner: true, isWritable: true },
            { pubkey: signer, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
          ],
          programId,
          data: Buffer.from(Uint8Array.of(0)),
        })
      );
  
      await program.provider.send(transaction, [signer]);
      console.log(`Vote bank initialized with vote account ${voteAccount.toBase58()}`);
    } catch (error) {
      console.log(error);
    }
  }
  
  async function gibVote(voteAccount: PublicKey, signer: PublicKey, voteType: 'GM' | 'GN'): Promise<void> {
    try {
      const program = new Program(idl_object, programId, getProvider());
  
      const transaction = new Transaction().add(
        new TransactionInstruction({
          keys: [
            { pubkey: voteAccount, isSigner: false, isWritable: true },
            { pubkey: signer, isSigner: true, isWritable: false },
          ],
          programId,
          data: Buffer.from(Uint8Array.of(1, voteType === 'GM' ? 0 : 1)),
        })
      );
  
      await program.provider.send(transaction, [signer]);
      console.log(`Vote recorded for ${voteType}`);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleClick() {
    if (!ourWallet.publicKey) {
      console.log("Wallet not connected");
      return;
    }
  
    if (!voteAccount) {
      console.log("Vote account not found");
      return;
    }
  
    if (!voteType) {
      console.log("Please enter a vote type");
      return;
    }
  
    try {
      const voteTypeParsed = voteType.toUpperCase() as 'GM' | 'GN';
      await gibVote(voteAccount, ourWallet.publicKey, voteTypeParsed);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleGetVoteCount() {
    try {
      if (!voteAccount) {
        throw new Error("Please provide a valid vote account");
      }
  
      const program = new Program(idl_object, programId, getProvider());
  
      const [voteBank] = await PublicKey.findProgramAddressSync(
        [Buffer.from("votebank")],
        programId
      );
  
      const result = await program.account.voteBank.fetch(voteBank);
      setVoteCount(result.voteCount);
    } catch (error) {
      console.log(error);
    }
  }
  


  return (
    <div className="flex flex-row justify-center">
      <div className="relative group items-center">
        <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="m-2">
          <label className="block font-medium text-gray-700">Vote Type</label>
          <div className="mt-1">
            <input
              type="text"
              name="vote-type"
              id="vote-type"
              value={voteType}
              onChange={(e) => setVoteType(e.target.value)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={handleClick}
          disabled={!ourWallet.publicKey}
        >
          <div className="hidden group-disabled:block">
            {ourWallet.connected ? (
              <p>Gib {voteType.toUpperCase()} vote</p>
            ) : (
              <p>Connect Wallet to Vote</p>
            )}
          </div>
        </button>
        <div className="m-2">
          <label className="block font-medium text-gray-700">Vote Count</label>
          <div className="mt-1">
            <input
              type="text"
              name="vote-count"
              id="vote-count"
              value={voteCount}
              readOnly
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={handleGetVoteCount}
        >
          <div className="hidden group-disabled:block">
            <p>Get Vote Count</p>
          </div>
        </button>
      </div>
    </div>
  );
            }
