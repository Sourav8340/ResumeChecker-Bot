'use client'
import Head from 'next/head'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <>
      <Head>
        <title>Resume Tailor ChatBot</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #F0F8FF, #bbdefb)',
          padding: '2rem',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <ChatInterface />
      </main>
    </>
  );
}