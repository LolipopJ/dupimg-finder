import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

export default function NextPage() {
  return (
    <React.Fragment>
      <Head>
        <title>Next - Nextron (with-tailwindcss)</title>
      </Head>
      <div className="grid-col-1 grid w-full text-center text-2xl">
        <div>
          <Image
            className="mx-auto"
            src="/images/logo.png"
            alt="Logo image"
            width={300}
            height={300}
          />
        </div>
        <span>⚡ Nextron ⚡</span>
      </div>
      <div className="mt-1 flex w-full flex-wrap justify-center">
        <Link href="/home">Go to home page</Link>
      </div>
    </React.Fragment>
  );
}
