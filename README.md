# callguru

Act as a senior full-stack architect.

Design a scalable Progressive Web App (PWA) called “CallGuru”, a platform where users can provide and receive paid video call consultations.

The platform should allow experts and service providers to sell their services through live video calls.

The system must be modular, scalable, and secure and should support 1M+ users.

Technology Stack

Frontend
React (Vite)
PWA (Service Worker + Web App Manifest)
TailwindCSS or Material UI

State Management
Redux Toolkit or Zustand

Backend
Firebase
Firebase Authentication
Firestore Database
Firebase Cloud Functions
Firebase Storage

Video Calling
WebRTC using PeerJS or similar library

Recording Storage
Encrypted video recordings stored using Google Drive API

OTP Login
Firebase Phone Authentication or Twilio API

Architecture

Follow clean architecture principles.

Separate layers:

UI Layer
State Layer
Service Layer
API Layer
Backend Logic

Generate a scalable project folder structure.

Core Modules

Authentication
User Profiles
Service Provider Profiles
Service Categories
Digital Wallet
Video Consultation System
Sessions / Orders
Real-time Chat
Appeals / Dispute System
Admin Dashboard
Referral / Invite System

User Management

Phone number login with OTP
User profile creation
Follow / unfollow providers
Provider verification (KYC)

Role Based Access Control

Roles:

User
Service Provider
Admin

Permissions must be validated through Firebase security rules and Cloud Functions.

Service Marketplace

Users can offer services delivered through live video calls.

Each provider can:

Create a service profile
Select service category
Set price per minute
Set availability schedule

Service Categories

Create the following categories:

Education & Learning
Professional Consultation
Tech Support
Personal Advice
Health & Fitness
Spiritual / Astrology
Creative Skills
Language Learning
Freelancing Help
Others

If a service does not fit into the main categories, it should be added under Others.

Video Consultation System

Implement WebRTC based video calls.

Call features:

Start call
End call
Connection status
Remote and local video streams

Calls must be prepaid.

Wallet balance should be deducted per minute during the call.

Create a session system including:

userId
providerId
pricePerMinute
startTime
endTime
totalCost
sessionStatus

Video Recording System

Implement backend-controlled recording.

Recording architecture can use:

Hidden recording peer
or server-controlled recording service

Encrypt recordings before storing.

Upload recordings to Google Drive using Google Drive API.

Create scheduled Cloud Functions that delete recordings automatically after 90 days.

Recording access must be restricted to Admin only.

Real-time Chat

Implement user-to-provider messaging using Firestore.

Design collections:

chats
messages

Message fields:

senderId
messageText
timestamp

Admins must have moderation tools.

Include audit logs whenever an admin accesses chat data.

Digital Wallet System

Wallet balance
Top-up system
Transaction history

Wallet is used to pay for video consultations.

All wallet transactions must be validated using Cloud Functions.

Sessions / Orders

Track video consultation sessions.

Session fields:

sessionId
userId
providerId
pricePerMinute
startTime
endTime
duration
totalCost
sessionStatus

Appeals / Dispute System

Users can submit disputes regarding:

Video consultation quality
Payment issues
Service complaints

Admins can review and resolve disputes.

Referral / Invite System

Each user receives a unique referral code.

Example referral link:

https://callguru.app/signup?ref=USER123

When a new user signs up using this referral code:

The referrer receives 1 referral point.

Optional Level 2 reward:

If User B invites User C, then User A receives 0.5 bonus points.

Prevent abuse:

No self-referrals
Only one reward per verified account
Referral rewards must be processed by Cloud Functions.

Admin Dashboard

Admin tools include:

User management
Provider verification
Service moderation
Session monitoring
Appeals management
Wallet monitoring
Chat moderation
Video recording management
Referral analytics
Platform analytics
Fee configuration

Firestore Database Design

Create scalable collections for:

users
services
sessions
walletTransactions
videoCalls
chats
messages
appeals
referrals
referralStats
adminLogs
kycSubmissions

Example user fields:

uid
phone
role
referralCode
referredBy
points
walletBalance
createdAt

Cloud Functions

Generate backend examples for:

createReferralCode()
applyReferralCode()
processWalletTransaction()
initiateVideoCall()
deductCallBalancePerMinute()
recordVideoCall()
fetchUserChatsForAdmin()
submitAppeal()
approveProviderKYC()
deleteOldRecordings()

Ensure all functions include authentication and role validation.

PWA Features

Installable PWA
Offline caching using service worker
Push notifications
Mobile-first responsive design

Internationalization

Support language switching between:

Bangla
English

Theme System

Implement Dark Mode and Light Mode.

Store user theme preference locally.

Security

Implement strong Firebase security rules.

Protect:

User data
Wallet transactions
Chat messages
Admin tools

Sensitive operations must run only inside Cloud Functions.

Output

Provide:

Complete project folder structure
React component stubs
Service layer examples
Firestore schema examples
Cloud Function examples
Firebase security rule suggestions

Focus heavily on scalability, maintainability, and security.

Reference Documentation

React
https://react.dev

Firebase
https://firebase.google.com/docs

Firestore
https://firebase.google.com/docs/firestore

WebRTC
https://webrtc.org

PeerJS
https://peerjs.com/docs

Google Drive API
https://developers.google.com/drive/api

Progressive Web Apps
https://web.dev/progressive-web-apps

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://callguru.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/475a4b18-0a4c-4fc4-90cb-fda525449caa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
