import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { Post } from './post.model';

const BACKEND_URL = environment.apiUrl + '/posts/';


@Injectable({ providedIn: 'root' })
export class PostsSevice {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    this.http.get<{message: string, posts: any, maxPosts: number}>(
        BACKEND_URL + queryParams
      )
      .pipe(
        map(postData => {
        return {
          posts: postData.posts.map(post => {
            return {
              id: post._id,
              title: post.title,
              content: post.content,
              imagePath: post.imagePath,
              creator: post.creator
            };
        }),
        maxPosts: postData.maxPosts
      };
      }))
      .subscribe(convertedPosts => {
        this.posts = convertedPosts.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: convertedPosts.maxPosts
        });
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<{
      _id: string;
      title: string;
      content: string;
      imagePath: string;
      creator: string;
    }>(
      BACKEND_URL + id
    );
  }

  addPost(title: string, content: string, image: File) {
    const newPost = new FormData();
    newPost.append('title', title);
    newPost.append('content', content);
    newPost.append('image', image, title);

    this.http
      .post<{ message: string, post: Post }>(
        BACKEND_URL,
        newPost)
      .subscribe((res) => {
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let newPost;
    if (typeof(image) === 'object') {
      newPost = new FormData();
      newPost.append('id', id);
      newPost.append('title', title);
      newPost.append('content', content);
      newPost.append('image', image, title);
    } else {
      newPost = {
        id,
        title,
        content,
        imagePath: image,
        creator: null
      };
    }
    this.http
      .put(BACKEND_URL + id, newPost)
      .subscribe(res => {
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + postId);
  }
}
