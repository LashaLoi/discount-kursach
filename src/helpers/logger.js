import path from "path";
import fs from "fs";
import moment from "moment";
import winston from "winston";
import expressWinston from "express-winston";

export const formatError = error => {
  fs.appendFile(
    path.join(__dirname, "../../logs/error.txt"),
    `\n${moment().format("lll")} ${error}`,
    err => {
      if (err) console.log(err);
    }
  );
  return error;
};

export const formatResponse = response => {
  fs.appendFile(
    path.join(__dirname, "../../logs/response.txt"),
    `\n${moment().format("lll")} ${JSON.stringify(response)}`,
    err => {
      if (err) console.log(err);
    }
  );
  return response;
};

const { splat, combine, timestamp, printf } = winston.format;

const myFormat = printf(
  ({ timestamp, meta }) =>
    `Time: ${timestamp}; Response: ${meta ? JSON.stringify(meta) : ""}`
);

export const logger = expressWinston.logger({
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/logs.log")
    })
  ],
  format: combine(timestamp(), splat(), myFormat),
  meta: true,
  msg:
    "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
  expressFormat: true,
  colorize: true
});
