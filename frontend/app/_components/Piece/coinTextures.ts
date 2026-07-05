const COIN_TEXTURES = ['/coin_tex_0.png', '/coin_tex_1.png', '/coin_tex_2.png', '/coin_tex_3.png'];

export function randomCoinTexture(): string {
  return COIN_TEXTURES[Math.floor(Math.random() * COIN_TEXTURES.length)];
}
