import { graphql } from "../lib/nhost";
import { randomShortCode } from "../lib/reviews";

async function codeExists(code: string): Promise<boolean> {
  const res = await graphql<{ short_urls: Array<{ short_code: string }> }>(
    `query($c: String!) { short_urls(where: { short_code: { _eq: $c } }, limit: 1) { short_code } }`,
    { useAdminSecret: true, variables: { c: code } }
  );
  return (res.data?.short_urls?.length ?? 0) > 0;
}

async function allocateCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const c = randomShortCode();
    if (!(await codeExists(c))) return c;
  }
  throw new Error("Could not allocate a unique short code");
}

async function main() {
  const dishRes = await graphql<{ insert_dishes_one: { id: number } }>(
    `mutation($name: String!, $data: jsonb!) {
       insert_dishes_one(object: { dish_name: $name, dish_data: $data }) { id }
     }`,
    {
      useAdminSecret: true,
      variables: {
        name: "Sample Vegan Mac & Cheese",
        data: {
          title: "Sample Vegan Mac & Cheese",
          description: "A cashew-and-potato cream sauce over elbow pasta. (Seed sample.)",
          image: "https://www.noracooks.com/wp-content/uploads/2021/01/vegan-mac-and-cheese-5.jpg",
        },
      },
    }
  );
  const dishId = dishRes.data?.insert_dishes_one?.id;
  if (!dishId) throw new Error("dish insert failed: " + JSON.stringify(dishRes.errors));

  const code = await allocateCode();
  const urlRes = await graphql<{ insert_short_urls_one: { short_code: string } }>(
    `mutation($code: String!, $tid: String!) {
       insert_short_urls_one(object: { short_code: $code, target_type: "dish_review", target_id: $tid }) { short_code }
     }`,
    { useAdminSecret: true, variables: { code, tid: String(dishId) } }
  );
  if (urlRes.errors) throw new Error("short_url insert failed: " + JSON.stringify(urlRes.errors));

  console.log(`Seeded dish ${dishId}. Review form: /s/${code}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
