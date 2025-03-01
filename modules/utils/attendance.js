require("dotenv").config();
const { EmbedBuilder, Client } = require("discord.js");
const { connectToGoogleSheets } = require("./submit");
const { getCurrentTimestamp,getData } = require("../utils/submit");
const { v4: uuidv4 } = require("uuid");


const attendance = async (message) => {
    try {
        const details = message.content.split(" ");
        if (details.length < 3) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Error")
                .setDescription("Please provide a price and at least one booster mention.");
            return message.reply({ embeds: [errorEmbed] });
        }

        const balanceSheet = await getData("Balance Sheet!A2:B");
        const priceInput = details[1];
        const boosters = details.slice(2);
        const discordIds = boosters.join(" ").match(/<@!?(\d+)>/g) || [];
        const ids = discordIds.map(id => id.replace(/<@!?|>/g, ""));

        if (ids.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Error")
                .setDescription("Please mention at least one booster.");
            return message.reply({ embeds: [errorEmbed] });
        }

        if (ids.length > 4) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Error")
                .setDescription("Maximum number of boosters in attendance is 4.");
            return message.reply({ embeds: [errorEmbed] });
        }

        const price = priceInput.replace(/k/i, "").trim();
        const runPrice = Number(price);

        if (isNaN(runPrice) || runPrice <= 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Error")
                .setDescription("The input is not a valid number. Please enter a positive amount.");
            return message.reply({ embeds: [errorEmbed] });
        }

        const attendanceId = uuidv4();
        const boosterCut = (runPrice ) / ids.length;

        const sheets = await connectToGoogleSheets();

        // Check if IDs exist in the balance sheet
        const missingIds = ids.filter(id => !balanceSheet.some(row => row[0] === id));

        // Notify admins if there are missing IDs
        if (missingIds.length > 0) {
            const warningEmbed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("Warning: Missing Boosters in Balance Sheet")
                .setDescription(
                    `The following booster IDs are not found in the balance sheet:\n${missingIds.join(", ")}\n\nPlease update the balance sheet to include these IDs.`
                )
                .setTimestamp();

            await message.channel.send({ embeds: [warningEmbed] });
        }

        // Append data to Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: "Boost!A:H",
            valueInputOption: "RAW",
            resource: {
                values: [
                    [
                        getCurrentTimestamp(),
                        runPrice * 1000,
                        "Mplus",
                        ids[0] || "",
                        ids[1] || "",
                        ids[2] || "",
                        ids[3] || "",
                        message.channel.id,
                        attendanceId
                    ],
                ],
            },
        });

        const nicknames = await Promise.all(ids.map(async id => {
            try {
                const member = await message.guild.members.fetch(id);
                return member.nickname || member.user.username;
            } catch {
                return "Unknown";
            }
        }));

        for (const id of ids) {
            try {
                const user = await message.client.users.fetch(id);
                const dmEmbed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("Attendance Recorded")
                    .setDescription(
                        `You have received **${boosterCut.toFixed(2)}** as your share of the price cut (65% of total, divided among **${ids.length}** boosters).\n\nAttendance ID: **${attendanceId}**`
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error(`Could not DM user ${id}:`, error);
                const errorEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Error")
                    .setDescription(
                        `Could not send a DM to one of the boosters (ID: ${id}). Please check their DM settings.`
                    );
                await message.reply({ embeds: [errorEmbed] });
            }
        }

        const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Attendance Recorded")
            .setDescription(`Attendance has been successfully recorded with the following details:`)
            .addFields(
                { name: "Price", value: `${runPrice}k`, inline: true },
                { name: "Booster Cut", value: `${boosterCut.toFixed(2)}k each`, inline: true },
                { name: "Boosters", value: boosters.join(", "), inline: false },
                { name: "Attendance ID", value: attendanceId, inline: false }
            )
            .setTimestamp();

        message.reply({ embeds: [successEmbed] });

    } catch (error) {
        console.error("Error handling attendance:", error);
        const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Error")
            .setDescription("There was an error recording the attendance. Please try again later.");
        message.reply({ embeds: [errorEmbed] });
    }
};

module.exports = { attendance };
