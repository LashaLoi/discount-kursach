import cron from "node-cron";
import cmd from "node-cmd";

export const task = cron.schedule("0 0 * * *", () => {
  console.log(1);
  cmd.get("npm run job");
});
