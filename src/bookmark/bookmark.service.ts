import { Injectable } from '@nestjs/common';
import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookMarkDto, EditBookMarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookMarkDto) {
    return await this.prisma.bookmark.create({
      data: {
        userId: userId,
        ...dto,
      },
    });
  }

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: userId,
      },
    });

    if (!bookmark) {
      return new NotFoundError('Bookmark not found');
    }

    // if (bookmark.userId !== userId) {
    //   return new NotFoundError('Bookmark not found');
    // }

    return [bookmark];
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookMarkDto,
  ) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    if (!bookmark) {
      return new NotFoundError('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      return new NotFoundError('Bookmark not found');
    }

    const bookMarkUpdated = await this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: { ...dto },
    });

    return bookMarkUpdated;
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    if (!bookmark) {
      return new NotFoundError('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      return new NotFoundError('Bookmark not found');
    }

    return await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
