type Tag = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  name: string;
};

type Image = {
  url: string;
  height: number;
  width: number;
};

export type Work = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  description: string;
  image: Image;
  images: Image[];
  tags: Tag[];
  demoLink?: string;
  codeLink?: string;
  date: string;
  text: string;
};
