/**
 * Takes a file or a string, loads it and turns it into a DataURL
 * @param file as File | string
 * @returns DataURL (as string)
 */
export const readFile = (file: File | string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(file);
    } else if (typeof file === "string") return resolve(file);
    else reject();
  });
