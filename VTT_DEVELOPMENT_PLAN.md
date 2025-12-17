# The Long Rest - VTT Development Plan

## Project Overview
A Virtual Tabletop (VTT) application for D&D campaigns built with T3 Stack (Next.js, tRPC, Prisma, NextAuth).

## Current Status

**🎉 MAJOR MILESTONE: Core VTT Features Complete! 🎉**

### ✅ Completed Features

#### Backend (tRPC Routers)
- **Campaign Management**
  - Create, read, update campaigns
  - DM/participant access control
  - Campaign listing with counts

- **Session Management**
  - Create game sessions
  - Get sessions by campaign
  - Update session status (PLANNED/ACTIVE/COMPLETED)
  - Join sessions (participants)

- **Character Management**
  - Create, read, update, delete characters
  - Character assignment to users
  - DM can manage all characters

- **Map Management**
  - Upload VTT files and map images
  - Basic VTT file parsing (walls, doors, lighting)
  - Map retrieval by session

#### Frontend (Pages)
- Campaign list page
- Campaign detail page (shows sessions and characters)
- Login/Register pages
- Basic navigation and routing

#### Database Schema
- Complete Prisma schema with all VTT models:
  - Campaign, GameSession, Character
  - Map, Token, FogOfWarState
  - Drawing, SpellEffect, ChatMessage
  - SessionParticipant

---

## 🚧 In Progress / Next Steps

### Phase 1: Core VTT Session View ✅ COMPLETE

#### 1.1 Session View Page
- [x] Create `/sessions/[id]` page
- [x] Layout with:
  - Map canvas (center)
  - Token panel (left sidebar)
  - Chat panel (right sidebar)
  - Toolbar (top)
  - Initiative tracker (bottom)

#### 1.2 Map Canvas Component
- [x] Render map image with grid overlay
- [x] Grid snapping
- [x] Pan and zoom controls
- [x] Display walls/doors from VTT data
- [x] Grid size configuration

#### 1.3 Token Management
- [x] Token router (create, update, delete, move)
- [x] Token rendering on canvas
- [x] Drag and drop tokens
- [x] Token selection
- [x] Token properties panel
- [x] Link tokens to characters

---

### Phase 2: Real-time Features ✅ COMPLETE

#### 2.1 WebSocket/Real-time Setup
- [x] Set up Server-Sent Events (SSE)
- [x] Real-time token movement sync
- [x] Real-time chat
- [x] Real-time drawing sync
- [x] Real-time fog of war updates
- [ ] Presence indicators (who's online) - Optional enhancement

#### 2.2 Chat System
- [x] Chat router (send messages, get history)
- [x] Chat UI component
- [x] Message types (TEXT, SYSTEM, DICE_ROLL)
- [x] Real-time message delivery
- [x] Message history pagination

---

### Phase 3: Advanced Map Features ✅ COMPLETE

#### 3.1 Fog of War
- [x] Fog of War router (update revealed areas)
- [x] Fog of War rendering
- [x] DM controls fog visibility
- [x] Player vision calculation
- [x] Auto-reveal based on token vision radius
- [x] Manual reveal/hide tools

#### 3.2 Drawing Tools
- [x] Drawing router (create, get, delete)
- [x] Drawing canvas overlay
- [x] Freehand drawing tool
- [ ] Shape tools (rectangle, circle, line) - Basic shapes via spell effects
- [x] Color picker
- [x] Stroke width control
- [ ] Erase tool - Can delete drawings
- [x] Layer management (drawings above/below tokens)

#### 3.3 Spell Effects
- [x] Spell effect router (create, update, delete)
- [x] Effect shapes (circle, sphere, cone, rectangle, line)
- [x] Visual effect rendering
- [ ] Effect duration/timer - Future enhancement
- [ ] Effect templates - Future enhancement
- [x] Click to place effects

---

### Phase 4: Vision & Lighting ✅ COMPLETE

#### 4.1 Vision System
- [x] Calculate vision based on token position
- [x] Vision radius per token
- [x] Darkvision support (token property)
- [x] Line of sight calculations
- [x] Wall blocking vision
- [ ] Dynamic lighting - Future enhancement

#### 4.2 Enhanced VTT Parsing
- [x] Basic VTT file format parser
- [x] Support basic VTT wall types
- [ ] Door states (open/closed/locked) - Future enhancement
- [x] Basic lighting data parsing
- [ ] Import from Foundry VTT format - Future enhancement
- [ ] Import from Roll20 format - Future enhancement

---

### Phase 5: Character & Gameplay Features ✅ COMPLETE

#### 5.1 Enhanced Character Management
- [x] Character creation form/page
- [x] Basic character stats (level, race, class)
- [ ] Character sheet UI - Future enhancement
- [ ] Inventory management - Future enhancement
- [ ] Spell list - Future enhancement
- [ ] Character notes - Future enhancement

#### 5.2 Dice Rolling
- [x] Dice roll UI component
- [x] Dice notation parser (e.g., "2d20+5")
- [x] Roll sharing in chat
- [x] Advantage/disadvantage support
- [ ] Roll history - Future enhancement

#### 5.3 Initiative Tracker
- [x] Initiative order management
- [x] Turn tracker UI
- [x] Round counter
- [x] Auto-sort by initiative

---

### Phase 6: UI/UX Improvements ✅ MOSTLY COMPLETE

#### 6.1 Session Management UI
- [x] Create session form/page
- [x] Session scheduling calendar (datetime picker)
- [x] Session status indicators
- [ ] Session notes/recap - Future enhancement

#### 6.2 Campaign Management UI
- [x] Create campaign form (basic)
- [x] Campaign detail page
- [ ] Campaign settings page - Future enhancement
- [ ] Campaign notes/journal - Future enhancement
- [ ] Player invitation system - Future enhancement

#### 6.3 Responsive Design
- [x] Basic responsive layout
- [ ] Mobile-friendly layout - Needs optimization
- [ ] Tablet optimization - Future enhancement
- [ ] Touch gestures for map interaction - Future enhancement

---

### Phase 7: Advanced Features 🚧 PARTIAL

#### 7.1 File Management
- [x] Map upload UI
- [x] Image upload for maps
- [ ] Image upload for tokens - Future enhancement
- [ ] Map library (reuse maps across sessions) - Future enhancement
- [ ] Asset management - Future enhancement
- [ ] File size optimization - Future enhancement

#### 7.2 Permissions & Roles
- [x] Player vs DM permissions (implemented throughout)
- [ ] Observer mode - Future enhancement
- [ ] Co-DM support - Future enhancement
- [ ] Player limits per campaign - Future enhancement

#### 7.3 Performance Optimization
- [x] Basic canvas rendering
- [x] Real-time updates via SSE
- [ ] Canvas rendering optimization - Future enhancement
- [ ] Large map handling - Future enhancement
- [ ] Token limit management - Future enhancement
- [ ] Caching strategies - Future enhancement
- [ ] Image compression - Future enhancement

---

## Technical Implementation Notes

### Real-time Communication
- Consider using:
  - **WebSockets** (via `ws` or Socket.io)
  - **Server-Sent Events** (simpler, one-way)
  - **tRPC subscriptions** (if available)
  - **Pusher/Ably** (third-party service)

### Canvas Library Options
- **Konva.js** - 2D canvas library with good performance
- **Fabric.js** - More features, heavier
- **PixiJS** - WebGL, best performance
- **React Konva** - React wrapper for Konva

### File Storage
- Currently using local file system (`./uploads`)
- Consider migrating to:
  - **AWS S3** / **Cloudflare R2**
  - **Vercel Blob Storage**
  - **Supabase Storage**

### Vision Calculation
- Use raycasting algorithms
- Consider libraries:
  - `rot.js` (roguelike toolkit, has FOV)
  - Custom implementation using Bresenham's line algorithm

---

## Priority Order

1. **Session View Page** - Core functionality
2. **Token Management** - Essential for gameplay
3. **Real-time Sync** - Makes it collaborative
4. **Chat System** - Communication
5. **Fog of War** - Core VTT feature
6. **Drawing Tools** - DM utility
7. **Vision System** - Advanced feature
8. **Everything else** - Polish and enhancements

---

## Quick Start Checklist

When starting a new feature:
- [ ] Create/update tRPC router
- [ ] Add input validation (Zod schemas)
- [ ] Implement access control (DM/participant checks)
- [ ] Create React component
- [ ] Add to session view page
- [ ] Test with multiple users
- [ ] Add error handling
- [ ] Update TypeScript types

---

## Notes

- Database schema is complete - no migrations needed for core features
- Authentication is set up - use `protectedProcedure` for all routes
- Access control pattern: Check if user is DM or has character in campaign
- File uploads currently use base64 encoding - consider multipart/form-data for large files

---

*Last Updated: Based on current codebase analysis*
*This plan should be updated as features are completed*

