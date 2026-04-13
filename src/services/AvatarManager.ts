// Avatar pixel art generator - Creates 32x32 pixel art characters with Canvas

export class AvatarManager {
  static drawAvatar(canvas: HTMLCanvasElement, avatarIndex: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 32;
    canvas.height = 32;

    ctx.clearRect(0, 0, 32, 32);
    ctx.imageSmoothingEnabled = false;

    switch (avatarIndex) {
      case 0: // 🤖 Robot cyan
        this.drawRobot(ctx);
        break;
      case 1: // 👾 Alien magenta
        this.drawAlien(ctx);
        break;
      case 2: // 🐉 Dragon green
        this.drawDragon(ctx);
        break;
      case 3: // 💀 Skull white
        this.drawSkull(ctx);
        break;
      case 4: // ⚡ Lightning yellow
        this.drawLightning(ctx);
        break;
      case 5: // 🦊 Fox orange
        this.drawFox(ctx);
        break;
      case 6: // 🌙 Moon blue
        this.drawMoon(ctx);
        break;
      case 7: // 🔥 Flame red
        this.drawFlame(ctx);
        break;
    }
  }

  private static drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  }

  private static drawRobot(ctx: CanvasRenderingContext2D) {
    // Head
    this.drawPixel(ctx, 8, 4, '#00ffff', 16); // head
    // Eyes
    this.drawPixel(ctx, 10, 8, '#000000', 2);
    this.drawPixel(ctx, 20, 8, '#000000', 2);
    // Mouth
    this.drawPixel(ctx, 12, 14, '#000000', 8);
    // Body
    this.drawPixel(ctx, 8, 20, '#00ffff', 16);
    // Arms
    this.drawPixel(ctx, 4, 22, '#00aa88', 4);
    this.drawPixel(ctx, 24, 22, '#00aa88', 4);
    // Legs
    this.drawPixel(ctx, 10, 28, '#0088ff', 2);
    this.drawPixel(ctx, 20, 28, '#0088ff', 2);
  }

  private static drawAlien(ctx: CanvasRenderingContext2D) {
    // Large head
    this.drawPixel(ctx, 6, 2, '#ff00ff', 5);
    this.drawPixel(ctx, 6, 7, '#ff00ff', 5);
    this.drawPixel(ctx, 6, 12, '#ff00ff', 5);
    this.drawPixel(ctx, 11, 2, '#ff00ff', 5);
    this.drawPixel(ctx, 16, 2, '#ff00ff', 5);
    this.drawPixel(ctx, 11, 7, '#ff00ff', 5);
    this.drawPixel(ctx, 16, 7, '#ff00ff', 5);
    this.drawPixel(ctx, 11, 12, '#ff00ff', 5);
    this.drawPixel(ctx, 16, 12, '#ff00ff', 5);
    // Eyes
    this.drawPixel(ctx, 8, 6, '#000000', 3);
    this.drawPixel(ctx, 18, 6, '#000000', 3);
    // Body
    this.drawPixel(ctx, 10, 17, '#ff00ff', 2);
    this.drawPixel(ctx, 14, 17, '#ff00ff', 2);
    this.drawPixel(ctx, 18, 17, '#ff00ff', 2);
    this.drawPixel(ctx, 10, 20, '#ff00ff', 2);
    this.drawPixel(ctx, 14, 20, '#ff00ff', 2);
    this.drawPixel(ctx, 18, 20, '#ff00ff', 2);
    // Tentacles
    this.drawPixel(ctx, 8, 22, '#ff00ff', 2);
    this.drawPixel(ctx, 20, 22, '#ff00ff', 2);
  }

  private static drawDragon(ctx: CanvasRenderingContext2D) {
    // Head
    this.drawPixel(ctx, 12, 4, '#00ff00', 8);
    // Eyes
    this.drawPixel(ctx, 14, 6, '#ffff00', 2);
    this.drawPixel(ctx, 18, 6, '#ffff00', 2);
    // Nose
    this.drawPixel(ctx, 16, 8, '#ffff00');
    // Body
    this.drawPixel(ctx, 8, 12, '#00ff00', 4);
    this.drawPixel(ctx, 12, 12, '#00ff00', 8);
    this.drawPixel(ctx, 20, 12, '#00ff00', 4);
    this.drawPixel(ctx, 8, 16, '#00ff00', 4);
    this.drawPixel(ctx, 12, 16, '#00ff00', 8);
    this.drawPixel(ctx, 20, 16, '#00ff00', 4);
    // Wings
    this.drawPixel(ctx, 4, 14, '#00aa00', 2);
    this.drawPixel(ctx, 24, 14, '#00aa00', 2);
    // Tail
    this.drawPixel(ctx, 24, 20, '#00ff00', 2);
    this.drawPixel(ctx, 26, 22, '#00ff00', 2);
  }

  private static drawSkull(ctx: CanvasRenderingContext2D) {
    // Skull
    this.drawPixel(ctx, 8, 4, '#ffffff', 2);
    this.drawPixel(ctx, 12, 2, '#ffffff', 2);
    this.drawPixel(ctx, 16, 2, '#ffffff', 2);
    this.drawPixel(ctx, 20, 4, '#ffffff', 2);
    this.drawPixel(ctx, 6, 6, '#ffffff', 4);
    this.drawPixel(ctx, 18, 6, '#ffffff', 4);
    this.drawPixel(ctx, 4, 10, '#ffffff', 4);
    this.drawPixel(ctx, 20, 10, '#ffffff', 4);
    // Eye sockets
    this.drawPixel(ctx, 8, 8, '#000000', 2);
    this.drawPixel(ctx, 16, 8, '#000000', 2);
    // Nose hole
    this.drawPixel(ctx, 12, 10, '#000000');
    // Teeth
    this.drawPixel(ctx, 8, 14, '#ffffff', 2);
    this.drawPixel(ctx, 12, 14, '#ffffff', 2);
    this.drawPixel(ctx, 16, 14, '#ffffff', 2);
    // Jaw
    this.drawPixel(ctx, 6, 16, '#ffffff', 4);
    this.drawPixel(ctx, 18, 16, '#ffffff', 4);
  }

  private static drawLightning(ctx: CanvasRenderingContext2D) {
    // Vertical lightning bolt
    this.drawPixel(ctx, 14, 2, '#ffff00', 4);
    this.drawPixel(ctx, 10, 6, '#ffff00', 4);
    this.drawPixel(ctx, 14, 8, '#ffff00', 4);
    this.drawPixel(ctx, 18, 12, '#ffff00', 4);
    this.drawPixel(ctx, 14, 14, '#ffff00', 4);
    this.drawPixel(ctx, 10, 18, '#ffff00', 4);
    this.drawPixel(ctx, 14, 20, '#ffff00', 4);
    this.drawPixel(ctx, 14, 24, '#ffff00', 4);
    this.drawPixel(ctx, 16, 28, '#ffff00', 2);
    // Glow
    this.drawPixel(ctx, 16, 4, '#ffffff', 2);
    this.drawPixel(ctx, 12, 10, '#ffffff', 2);
    this.drawPixel(ctx, 16, 16, '#ffffff', 2);
  }

  private static drawFox(ctx: CanvasRenderingContext2D) {
    // Head
    this.drawPixel(ctx, 8, 4, '#ff8800', 2);
    this.drawPixel(ctx, 12, 2, '#ff8800', 4);
    this.drawPixel(ctx, 18, 4, '#ff8800', 2);
    // Ears
    this.drawPixel(ctx, 6, 2, '#ff6600', 2);
    this.drawPixel(ctx, 22, 2, '#ff6600', 2);
    // Face
    this.drawPixel(ctx, 8, 6, '#ff8800', 2);
    this.drawPixel(ctx, 18, 6, '#ff8800', 2);
    // Eyes
    this.drawPixel(ctx, 10, 6, '#000000');
    this.drawPixel(ctx, 16, 6, '#000000');
    // Nose
    this.drawPixel(ctx, 12, 8, '#000000');
    // Mouth
    this.drawPixel(ctx, 11, 10, '#ffff00');
    this.drawPixel(ctx, 13, 10, '#ffff00');
    // Body
    this.drawPixel(ctx, 10, 12, '#ff8800', 4);
    this.drawPixel(ctx, 14, 12, '#ff8800', 4);
    this.drawPixel(ctx, 18, 12, '#ff8800', 2);
    // Tail
    this.drawPixel(ctx, 22, 14, '#ff8800', 2);
  }

  private static drawMoon(ctx: CanvasRenderingContext2D) {
    // Crescent moon shape
    this.drawPixel(ctx, 10, 4, '#4488ff', 2);
    this.drawPixel(ctx, 14, 2, '#4488ff', 2);
    this.drawPixel(ctx, 18, 4, '#4488ff', 2);
    this.drawPixel(ctx, 8, 8, '#4488ff', 2);
    this.drawPixel(ctx, 20, 8, '#4488ff', 2);
    this.drawPixel(ctx, 6, 12, '#4488ff', 2);
    this.drawPixel(ctx, 22, 12, '#4488ff', 2);
    this.drawPixel(ctx, 8, 16, '#4488ff', 2);
    this.drawPixel(ctx, 20, 16, '#4488ff', 2);
    this.drawPixel(ctx, 10, 20, '#4488ff', 2);
    this.drawPixel(ctx, 18, 20, '#4488ff', 2);
    this.drawPixel(ctx, 14, 22, '#4488ff', 2);
    // Face features
    this.drawPixel(ctx, 12, 10, '#ffff00');
    this.drawPixel(ctx, 16, 10, '#ffff00');
    this.drawPixel(ctx, 14, 14, '#ffff00');
  }

  private static drawFlame(ctx: CanvasRenderingContext2D) {
    // Flame shape
    this.drawPixel(ctx, 12, 2, '#ff4400', 2);
    this.drawPixel(ctx, 10, 4, '#ff4400', 2);
    this.drawPixel(ctx, 14, 4, '#ff4400', 2);
    this.drawPixel(ctx, 8, 8, '#ff4400', 2);
    this.drawPixel(ctx, 16, 8, '#ff4400', 2);
    this.drawPixel(ctx, 6, 12, '#ff4400', 2);
    this.drawPixel(ctx, 18, 12, '#ff4400', 2);
    this.drawPixel(ctx, 8, 16, '#ff4400', 2);
    this.drawPixel(ctx, 16, 16, '#ff4400', 2);
    this.drawPixel(ctx, 10, 20, '#ffff00', 2);
    this.drawPixel(ctx, 14, 20, '#ffff00', 2);
    this.drawPixel(ctx, 12, 24, '#ffff00', 2);
    // Inner glow
    this.drawPixel(ctx, 12, 6, '#ffff00');
    this.drawPixel(ctx, 12, 10, '#ffff00');
    this.drawPixel(ctx, 12, 14, '#ffff00');
  }

  static getAvatarName(index: number): string {
    const names = ['Robot', 'Alien', 'Dragon', 'Skull', 'Lightning', 'Fox', 'Moon', 'Flame'];
    return names[index] || 'Avatar';
  }

  static getAvatarEmoji(index: number): string {
    const emojis = ['🤖', '👾', '🐉', '💀', '⚡', '🦊', '🌙', '🔥'];
    return emojis[index] || '👤';
  }
}
