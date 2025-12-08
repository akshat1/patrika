export interface SCToken {
  type   : string;
  raw    : string;
  text   : string;
  tokens?: SCToken[];
  html   : string;
  args   : Record<string, unknown>;
}
