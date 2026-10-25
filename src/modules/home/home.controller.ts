import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class HomeController {
  @Get()
  @Render('home')
  index() {
    return { title: 'Sistema Nuevos Horizontes' };
  }
}
