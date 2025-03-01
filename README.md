# Celestial Discord Bot

A feature-rich Discord bot for gaming communities with Google Sheets integration for managing balance, transactions, and player data.

## Features

- **Balance Management**: Track and manage player balances stored in Google Sheets
- **M+ (Mythic Plus) Rating System**: Process Raider.io links and assign roles based on M+ scores
- **Transaction System**: Monitor and record transactions between players
- **Channel Management**: Auto-generate HTML transcripts of channels before deletion
- **Attendance Tracking**: Record and track player attendance
- **Role Management**: Automatically assign roles based on player criteria

## Setup Instructions

### Prerequisites

- Node.js v16.6.0 or higher
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Google Sheets API credentials

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/celestial-discordBot.git
   cd celestial-discordBot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_bot_client_id
   GUILD_ID=your_discord_server_id
   GOOGLE_SHEET_ID=your_google_sheet_id
   GOOGLE_SERVICE_ACCOUNT_CREDENTIALS=path_to_your_credentials.json
   ```

4. Set up Google Sheets API:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create a service account and download the credentials JSON file
   - Share your Google Sheet with the service account email

5. Start the bot:
   ```bash
   node index.js
   ```

### Configuration

Most of the bot's configuration is in the `modules/utils/config.js` file. You can customize:

- Channel IDs
- Role IDs
- Command prefixes
- Sheet ranges
- Cache timings

## Commands

### Slash Commands

- `/submit user:[user] namerealm:[name-realm] amount:[amount] note:[note]` - Add balance to a user
- `/boost` - Create a boost listing
- `/goldprice` - Check the current gold price
- `/mplus` - Create a Mythic+ group

### Text Commands

- `!balance` or `!b` or `.b` or `.balance` - Check your balance (in balance channel)
- `!m [details]` - Record attendance
- `!done` - Create transcript and delete channel
- `!rename [details]` - Rename character/user

## Modules

The bot is organized into several modules:

- **Handler**: Main message handler (`handler.js`)
- **Utils**: Utility functions for various features
  - `submit.js` - Balance and sheet submission
  - `chatredirect.js` - Channel message redirection
  - `currency.js` - Currency handling
  - `transaction.js` - Transaction processing
  - `mplus.js` - Mythic+ functionality
  - `attendance.js` - Attendance tracking
  - `rename.js` - Renaming utilities
- **Commands**: Slash command definitions
- **Handlers**: Custom event handlers

## Google Sheets Integration

The bot integrates with several Google Sheets tabs:

- `Gold Payment` - Records gold payments
- `Payment` - Tracks cash payments
- `Balance Sheet` - Maintains user balances

### Sheet Structure

#### Gold Payment Sheet

- Column A: Timestamp
- Column B: User ID
- Columns C-D: Character info and amount
- Column E-G: Additional info
- Column K: Payment status

#### Balance Sheet

- Column A: Index
- Column B: User ID
- Column C: Name
- Column D: Balance

## Troubleshooting

- **Commands not registering**: Ensure your bot has the correct permissions and application.commands scope
- **Google Sheets errors**: Check that your service account has edit permissions to the sheet
- **Missing role errors**: Verify role IDs in the config match your server roles

## License

MIT License

## Support

For support, please open an issue on GitHub or contact the developer.
