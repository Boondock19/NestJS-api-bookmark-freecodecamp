import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookMarkDto, EditBookMarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const baseUrl = 'http://localhost:3000';
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3000);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'matias@gmail.com',
      password: '123456',
    };
    describe('Singup', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post(`${baseUrl}/auth/signup`)
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
    });

    it('Should throw if password empty', () => {
      return pactum
        .spec()
        .post(`${baseUrl}/auth/signup`)
        .withBody({
          email: dto.email,
        })
        .expectStatus(400);
    });

    it('Should singup', () => {
      return pactum
        .spec()
        .post(`${baseUrl}/auth/signup`)
        .withBody(dto)
        .expectStatus(201);
    });

    describe('Singin', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post(`${baseUrl}/auth/signin`)
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
    });

    it('Should throw if password empty', () => {
      return pactum
        .spec()
        .post(`${baseUrl}/auth/signin`)
        .withBody({
          email: dto.email,
        })
        .expectStatus(400);
    });

    it('Should singin', () => {
      return pactum
        .spec()
        .post(`${baseUrl}/auth/signin`)
        .withBody(dto)
        .expectStatus(200)
        .stores('userAt', 'access_token');
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .get(`${baseUrl}/users/me`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const editDto: EditUserDto = {
        email: 'joseActual@gmail.com',
        firstName: 'Jose',
        lastName: 'Gonzalez',
      };

      it('Should edit user', () => {
        return pactum
          .spec()
          .patch(`${baseUrl}/users/edit`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(editDto)
          .expectStatus(200)
          .expectBodyContains(editDto.firstName)
          .expectBodyContains(editDto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should get empty bookmakrs', () => {
        return pactum
          .spec()
          .get(`${baseUrl}/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const createBookMarkDto: CreateBookMarkDto = {
        title: 'Nestjs',
        description: 'https://nestjs.com/',
        link: 'https://nestjs.com/',
      };
      it('Should create bookmark', () => {
        return pactum
          .spec()
          .post(`${baseUrl}/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(createBookMarkDto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get(`${baseUrl}/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Get bookmark by id', () => {
      it('Should get  bookmark  by id', () => {
        return pactum
          .spec()
          .get(`${baseUrl}/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      const editBookMarkDto: EditBookMarkDto = {
        title: 'Edited',
        description: 'Bookmark has been edited',
        link: 'https://nestjs132132123.com/',
      };
      it('Should Edit bookmark by id', () => {
        return pactum
          .spec()
          .patch(`${baseUrl}/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(editBookMarkDto)
          .expectStatus(200)
          .expectBodyContains(editBookMarkDto.title)
          .expectBodyContains(editBookMarkDto.description)
          .inspect();
      });
    });

    describe('Delete bookmark by id', () => {
      it('Should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete(`${baseUrl}/bookmarks/{id}`)
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204)
          .inspect();
      });

      it('Should get empty bookmakrs', () => {
        return pactum
          .spec()
          .get(`${baseUrl}/bookmarks`)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });
  });
});
